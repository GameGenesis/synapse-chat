import { models } from "@/lib/utils/model-provider";
import {
    debuggerSchema,
    programmerSchema,
    projectManagerSchema,
    supervisorSchema,
    writerSchema
} from "./schemas";
import { AgentBuilder, AgentNetwork } from "./agent-builder";

// Function to create and use the agent network
export async function createAndUseAgentNetwork(prompt: string): Promise<any[]> {
    const agentBuilder = new AgentBuilder();

    // Create Project Manager
    const projectManager = agentBuilder.build({
        name: "Project Manager",
        role: "You are a project manager. Create a task list and delegate tasks to appropriate agents. Make sure to remain within the project scope and not over-delegate. Use the smallest number of agents that can get the job done well.",
        model: models.gpt4omini,
        temperature: 0.7,
        maxTokens: 1000,
        schema: projectManagerSchema
    });

    // Create Supervisor
    const supervisor = agentBuilder.build({
        name: "Supervisor",
        role: "You are a supervisor. Review the work of other agents and provide guidance, context, steer the direction back to the project if it goes off course. Also, determine if the project is complete or needs necessary revisions",
        model: models.gpt4omini,
        temperature: 0.7,
        maxTokens: 1000,
        schema: supervisorSchema
    });

    // Create Agent Network
    const agentNetwork = new AgentNetwork(projectManager, supervisor);

    // Create and add other agents to the network
    const programmerAgent = agentBuilder.build({
        name: "Programmer",
        role: "You are a senior software engineer.",
        model: models.gpt4omini,
        temperature: 0.5,
        maxTokens: 4096,
        schema: programmerSchema
    });

    const debuggerAgent = agentBuilder.build({
        name: "Debugger",
        role: "You are a senior software engineer, QA expert, and debugger specialist. Check for any bugs or missing edge cases, and if there are bugs, report them to be fixed. Testing cannot be performed in any way other than checking the code, so you do not need to mention checking the code. Your job is to find bugs and edge cases, so do try to delegate that to anyone else.",
        model: models.gpt4omini,
        temperature: 0.5,
        maxTokens: 4096,
        schema: debuggerSchema
    });

    const writerAgent = agentBuilder.build({
        name: "Writer",
        role: "You are an expert writer.",
        model: models.gpt4omini,
        temperature: 0.5,
        maxTokens: 4096,
        schema: writerSchema
    });

    const editorAgent = agentBuilder.build({
        name: "Writer",
        role: "You are an expert editor. You will check the content you receive for spelling, clearness, and grammar errors. Improve the content, but do not add to it. ",
        model: models.gpt4omini,
        temperature: 0.5,
        maxTokens: 4096,
        schema: writerSchema
    });

    const summarizerAgent = agentBuilder.build({
        name: "Writer",
        role: "You are an expert summarizer.",
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
