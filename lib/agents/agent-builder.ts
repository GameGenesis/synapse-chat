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

    async executePrompt(prompt: string): Promise<any> {
        let context = { originalPrompt: prompt };
        const messages = [];
        let revisionCount = 0;

        while (revisionCount < this.maxRevisions) {
            // Step 1: Project Manager creates or updates task list
            const availableAgents = Object.keys(this.agents);
            const pmResult = await this.projectManager.execute(`
        Available Agents: ${availableAgents}
        Original Prompt: ${prompt}
        Current Context: ${JSON.stringify(context)}
        ${
            revisionCount > 0
                ? "Update the task list based on the current context."
                : "Create an initial task list."
        }
      `);
            messages.push({
                agent: this.projectManager.name,
                result: pmResult,
                context
            });
            const taskList = pmResult.taskList;
            // console.log("# Project Manager:\n", JSON.stringify(pmResult), `\nCurrent Context: ${JSON.stringify(context)}\n`);

            context = { ...context, ...taskList };

            let needsRevision = false;

            for (const task of taskList) {
                const agent = this.agents[task.agent];
                if (!agent) {
                    throw new Error(`Agent ${task.agent} not found`);
                }

                // Execute the task with the current agent
                const result = await agent.execute(task.instructions, context);

                // Update context with the result
                context = { ...context, [task.agent]: result };

                // Supervisor reviews and updates context
                const supervisorReview = await this.supervisor.execute(
                    JSON.stringify(context)
                );
                context = { ...context, ...supervisorReview };

                // console.log(`
                //   # Agent: ${task.agent}
                //   # Result: ${JSON.stringify(result)}

                //   # Supervisor Review: ${JSON.stringify(supervisorReview)}
                // `);

                if (supervisorReview.needsRevision) {
                    needsRevision = true;
                    break;
                }

                messages.push({
                    agent: task.agent,
                    task: task.instructions,
                    result,
                    review: supervisorReview
                });
            }

            if (!needsRevision) {
                break;
            }

            revisionCount++;
        }

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
