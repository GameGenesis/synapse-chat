import { z } from 'zod';
import { getModel, ModelConfig, models } from "@/lib/utils/model-provider";
import { generateObject } from 'ai';

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
class AgentNetwork {
  private agents: { [key: string]: Agent };
  private projectManager: Agent;
  private supervisor: Agent;

  constructor(projectManager: Agent, supervisor: Agent) {
    this.agents = {};
    this.projectManager = projectManager;
    this.supervisor = supervisor;
  }

  addAgent(agent: Agent) {
    this.agents[agent.name] = agent;
  }

  async executePrompt(prompt: string): Promise<any> {
    let context = { originalPrompt: prompt };
    let finalResult: any;
    let taskList: any[] = [];

    while (true) {
      // Step 1: Project Manager creates or updates task list
      const availableAgents = Object.keys(this.agents);
      const pmResult = await this.projectManager.execute(`
        Available Agents: ${availableAgents}
        Original Prompt: ${prompt}
        Current Context: ${JSON.stringify(context)}
        ${taskList.length > 0 ? 'Update the task list based on the current context.' : 'Create an initial task list.'}
      `);
      console.log("# Project Manager:\n", JSON.stringify(pmResult));
      taskList = pmResult.taskList;

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
        const supervisorReview = await this.supervisor.execute(JSON.stringify(context));
        context = { ...context, ...supervisorReview };

        console.log(`
          # Agent: ${task.agent}
          # Result: ${JSON.stringify(result)}
          # Supervisor Review: ${JSON.stringify(supervisorReview)}
        `);

        if (supervisorReview.needsRevision) {
          needsRevision = true;
          break;
        }

        finalResult = result;
      }

      if (!needsRevision) {
        break;
      }
    }

    return finalResult;
  }
}

// Create the AgentBuilder class
class AgentBuilder {
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
          prompt: context ? `${JSON.stringify(context)}\n\n${prompt}` : prompt,
          schema: config.schema
        });

        return object;
      },
    };
  }
}

// Define schemas
const projectManagerSchema = z.object({
    innerThinking: z.string().optional(),
    taskList: z.array(z.object({
        agent: z.string(),
        instructions: z.string()
      })).describe("Only choose the agents that are relevant to the task. Keep within the scope of the described task.")
})

const supervisorSchema = z.object({
  summary: z.string(),
  nextSteps: z.string().optional().describe("Describes the next steps to be performed for the project to be completed. Leave blank if the project has been completed and no further revisions are needed."),
  concerns: z.array(z.string()).optional(),
  needsRevision: z.boolean().describe("Set to true if the task needs to be revised by the project manager. This should only be the case if it is imperative that the current concerns be resolved or if you feel the project hasn't been completed successfully."),
});

const programmerSchema = z.object({
  innerThinking: z.string().optional(),
  code: z.string(),
  comments: z.string().optional()
});

const debuggerSchema = z.object({
  innerThinking: z.string().optional(),
  bugs: z.array(z.string()).optional(),
  edgeCases: z.array(z.string()).optional(),
  comments: z.string().optional()
});

const writerSchema = z.object({
  innerThinking: z.string().optional(),
  content: z.string(),
});

// Function to create and use the agent network
export async function createAndUseAgentNetwork(
  prompt: string
): Promise<any> {
  const agentBuilder = new AgentBuilder();

  // Create Project Manager
  const projectManager = agentBuilder.build({
    name: 'Project Manager',
    role: 'You are a project manager. Create a task list and delegate tasks to appropriate agents.',
    model: models.gpt4omini,
    temperature: 0.7,
    maxTokens: 1000,
    schema: projectManagerSchema
  });

  // Create Supervisor
  const supervisor = agentBuilder.build({
    name: 'Supervisor',
    role: 'You are a supervisor. Review the work of other agents and provide guidance.',
    model: models.gpt4omini,
    temperature: 0.7,
    maxTokens: 1000,
    schema: supervisorSchema
  });

  // Create Agent Network
  const agentNetwork = new AgentNetwork(projectManager, supervisor);

  // Create and add other agents to the network
  const programmerAgent = agentBuilder.build({
    name: 'Programmer',
    role: 'You are a senior software engineer.',
    model: models.gpt4omini,
    temperature: 0.5,
    maxTokens: 4096,
    schema: programmerSchema
  });

  const debuggerAgent = agentBuilder.build({
    name: 'Debugger',
    role: 'You are a senior software engineer, QA expert, and debugger specialist. Check for any bugs or missing edge cases, and if there are bugs, report them to be fixed. Testing cannot be performed in any way other than checking the code, so you do not need to mention checking the code. Your job is to find bugs and edge cases, so do try to delegate that to anyone else.',
    model: models.gpt4omini,
    temperature: 0.5,
    maxTokens: 4096,
    schema: debuggerSchema
  });

  const writerAgent = agentBuilder.build({
    name: 'Writer',
    role: 'You are an expert writer.',
    model: models.gpt4omini,
    temperature: 0.5,
    maxTokens: 4096,
    schema: writerSchema
  });

  const editorAgent = agentBuilder.build({
    name: 'Writer',
    role: 'You are an expert editor. You will check the content you receive for spelling, clearness, and grammar errors. Improve the content, but do not add to it. ',
    model: models.gpt4omini,
    temperature: 0.5,
    maxTokens: 4096,
    schema: writerSchema
  });

  const summarizerAgent = agentBuilder.build({
    name: 'Writer',
    role: 'You are an expert summarizer.',
    model: models.gpt4omini,
    temperature: 0.5,
    maxTokens: 4096,
    schema: writerSchema
  });

  agentNetwork.addAgent(programmerAgent);
  agentNetwork.addAgent(debuggerAgent);
  agentNetwork.addAgent(writerAgent);
  agentNetwork.addAgent(editorAgent);
  agentNetwork.addAgent(summarizerAgent);

  // Execute the prompt using the agent network
  return await agentNetwork.executePrompt(prompt);
}

// Example usage in an API route
export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const result = await createAndUseAgentNetwork(prompt);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}