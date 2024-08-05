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

        while (revisionCount < this.maxRevisions) {
            // Step 1: Project Manager creates or updates task list
            let taskList: any[];
            if (revisionCount === 0 && initialTaskList) {
                taskList = initialTaskList;
            } else {
                const availableAgents = Object.keys(this.agents);
                const pmResult = await this.projectManager.execute(`
                    Available Agents: ${availableAgents}
                    Original Prompt: ${prompt}
                    Current Context: ${JSON.stringify(context)}
                    ${
                        revisionCount > 0 || initialTaskList
                            ? "Update the task list based on the current context."
                            : "Create an initial task list."
                    }
                `);

                console.log(`Current Context: ${JSON.stringify(context)}`);

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

                messages.push({
                    agent: this.supervisor.name,
                    content: supervisorReview,
                    type: "review"
                });

                if (supervisorReview.needsRevision) {
                    needsRevision = true;
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
