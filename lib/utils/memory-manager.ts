import { generateObject } from "ai"
import { models, getModel } from "./model-provider"
import { z } from "zod"

export const extractMemory = async (message: string) => {
    console.log(message);
    const {object} = await generateObject({
        model: getModel(models.llama_3_70b_tool_use),
        system: `
You are an expert in memory analysis. You will be analyzing a message to identify any information that constitutes an important long-term memory to permanently store. Your task is to carefully consider the content, decide if any elements should be remembered for the long term, and if so, extract concise, descriptive, and relevant memories from the given message.

## Instructions
First, analyze the message step by step using innerThinking to determine if any information should be stored as a long-term memory. Consider whether any information is worth storing as a long-term memory. Follow the guidelines below.

### Step-by-Step Analysis (InnerThinking):
- Begin by carefully reading the message.
- Reflect on each piece of information, evaluating whether it is significant enough to be stored for the long term.
- Consider the potential future value of this information. Would it aid in decision-making or provide valuable context later?

### Guidelines for identifying important long-term memories:
1. Focus on significant events, achievements, or milestones
2. Include important personal information (e.g., names, relationships, dates)
3. Capture unique experiences or notable changes in circumstances
4. Identify strong emotions or impactful realizations
5. Extract factual information that may be useful in the future

### Guidelines for formulating memories:
1. Be very concise and to the point, but descriptive
2. Focus on the most crucial information
3. Avoid unnecessary details
4. Use clear and straightforward language in a single sentence

Each memory should be a single, clear sentence that captures the essence of the information. Do not include multiple separate pieces of information in one memory.

### Examples of InnerThinking
- This message mentions that John graduated. Graduation is a significant milestone, so this should be stored.
- The message talks about John's good mood today, but this isn't crucial for long-term memory, so I'll skip it.
- The detail about John's new job in San Francisco is relevant for his future career path, so it should be captured.

### Examples of good memory extractions:
- User's name is John.
- John got married to Sarah on June 15, 2023.
- Graduated from Harvard University with a degree in Computer Science.
- Moved to a new city, San Francisco, for a job at Google.
- Daughter has a milk allergy.

### Examples of bad memory extractions:
- John did some stuff. (Too vague)
- John is feeling good today. (Not relevant for long-term memory)
- John got married to Sarah on June 15, 2023, and they had a beautiful ceremony with 150 guests at a beachside resort. (Too detailed for a single memory and contains unnecessary information)

### Final Output Format:
- If no information in the message meets the criteria for long-term memory, return an empty array.
- If important information is identified, output an array containing each extracted memory as a single, clear sentence.
- Preferably extract a maximum of one memory per message.

Remember, the goal is to store only truly significant information that may be valuable for future reference or decision-making.
`,
        schema: z.object({
            innerThinking: z.string().describe("Use this property to think step by step on whether anything in the provided message constitutes a permanent memory."),
            memories: z.array(z.string()).describe("The information to store as a memory or memories. Keep this brief, concise, but descriptive.")
        }),
        prompt: message,
        temperature: 0.3,
        maxTokens: 512
    })

    console.log(JSON.stringify(object));
    return object;
}