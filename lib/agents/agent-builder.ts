import { z } from "zod";
import { getModel, ModelConfig } from "@/lib/utils/model-provider";
import { generateObject } from "ai";

// Define the Agent interface
interface Agent {
    name: string;
    role: string;
    model: ModelConfig;
    temperature: number;
    maxTokens: number;
    schema: z.ZodType<any>;
    execute: (prompt: string, context?: any) => Promise<any>;
}

interface Message {
    agent: string;
    content: any;
    type: "task" | "result" | "review";
}

// Define the AgentNetwork class
export class AgentNetwork {
    private agents: { [key: string]: Agent };
    private projectManager: Agent;
    private supervisor: Agent;
    private maxRevisions: number = 2;

    constructor(
        projectManager: Agent,
        supervisor: Agent,
        maxRevisions: number = 2
    ) {
        this.agents = {};
        this.projectManager = projectManager;
        this.supervisor = supervisor;
        this.maxRevisions = maxRevisions;
    }

    addAgent(agent: Agent) {
        this.agents[agent.name] = agent;
    }

    listAgents() {
        return Object.values(this.agents);
    }

    async executePrompt(prompt: string, additionalContext?: string, initialTaskList?: any[]): Promise<any> {
        let context: any = { originalPrompt: prompt, additionalContext };
        const messages: Message[] = [];
        let revisionCount = 0;
        let projectRevisionReport = ""

        while (revisionCount < this.maxRevisions) {
            // Step 1: Project Manager creates or updates task list
            let taskList: any[];
            if (revisionCount === 0 && initialTaskList) {
                taskList = initialTaskList;
            } else {
                const availableAgents = this.listAgents().map((agent, index) => `<agent_${index}>Agent Name: ${agent.name}\nAgent Role: ${agent.role.substring(0, 100)}..</agent_${index}>`).join("\n");
                const pmPrompt = `
Carefully read the project description and any additional context:

<project_description>
## This is the initial description for the project:
${prompt}

## Additional Context:
${additionalContext}
</project_description>

${projectRevisionReport ? `
<project_revision_report>
The project has some issues and the supervisor has decided it needs some revisions.
Use these revisions to create a new tasklist to update the current project. Do not repeat tasks from the previous tasklist if they have already been completed.

## Project Revision Report:
${projectRevisionReport}
</project_revision_report>

<project_context>
Review the current project context to make decisions on where to proceed with the new task list in order to resolve the issues mentioned in the \`project_revision_report\`.

## Context:
${JSON.stringify(context)}
</project_context>
` : ""}

Review the list of available agents and their roles:

<available_agents>
${availableAgents}
</available_agents>

${
    revisionCount > 0
        ? "Update the task list based on the \`project_revision_report\` and \`project_context\`."
        : "Create an initial task list."
}
`
                const pmResult = await this.projectManager.execute(pmPrompt);
                console.log(pmPrompt);
                console.log(JSON.stringify(pmResult));

                messages.push({
                    agent: this.projectManager.name,
                    content: pmResult,
                    type: "task"
                });

                taskList = pmResult.taskList;
            }

            context = { ...context, taskList };

            let needsRevision = false;

            for (const task of taskList) {
                const agent = this.agents[task.agent];
                if (!agent) {
                    throw new Error(`Agent ${task.agent} not found`);
                }

                // Execute the task with the current agent
                console.log(`### AGENT: ${agent.name} ###\n\n# Instructions: ${task.instructions}\n\n# Context: ${JSON.stringify(context)}\n\n`)
                const result = await agent.execute(task.instructions, context);

                messages.push({
                    agent: task.agent,
                    content: result,
                    type: "result"
                });

                const supervisorReview = await this.supervisor.execute(
                    JSON.stringify({
                        agent: task.agent,
                        task: task.instructions,
                        result: result
                    })
                );
                console.log(`### Supervisor Review:  ###\n\n${JSON.stringify(supervisorReview)}`)

                messages.push({
                    agent: this.supervisor.name,
                    content: supervisorReview,
                    type: "review"
                });

                if (supervisorReview.needsRevision) {
                    needsRevision = true;
                    projectRevisionReport = supervisorReview.report;
                    context = {
                        ...context,
                        ...supervisorReview.updatedContext
                    };
                    break;
                }

                // Update context with the result and review
                context = {
                    ...context,
                    [task.agent]: result,
                    supervisorReview
                };
            }

            if (!needsRevision) {
                break;
            }

            revisionCount++;
        }

        console.log(JSON.stringify(messages));
        return messages;
    }
}

// Create the AgentBuilder class
export class AgentBuilder {
    build(config: {
        name: string;
        role: string;
        model: ModelConfig;
        temperature: number;
        maxTokens: number;
        schema: z.ZodType<any>;
    }): Agent {
        return {
            name: config.name,
            role: config.role,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            schema: config.schema,
            execute: async (prompt: string, context?: any) => {
                const { object } = await generateObject({
                    model: getModel(config.model),
                    system: config.role,
                    temperature: config.temperature,
                    maxTokens: config.maxTokens,
                    prompt: context
                        ? `${JSON.stringify(context)}\n\n${prompt}`
                        : prompt,
                    schema: config.schema
                });

                return object;
            }
        };
    }
}
