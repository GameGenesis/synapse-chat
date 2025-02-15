# Synapse Chat

An [AI chatbot](https://ai-chat-artifacts.onrender.com/) that supports chat artifacts (like Claude), Bing web search (like Perplexity.ai), multi-turn agentic workflows, open source models, advanced CoT logic and reasoning mode, memory, vision, file upload, and much more.

## Setup
1. Clone the repository
2. Create a `.env` file and fill in the appropriate API keys from the `.env.example` file
3. Install the dependencies:
   ```bash
   $ npm install
   ```
4. Build the project:
   ```bash
   $ npm run build
   ```
5. Start the server:
   ```bash
   $ npm run start
   ```

Make sure to replace any placeholders in the `.env.example` file with your actual API keys and configuration settings.

## Features
- **Chat Artifacts**: Supports chat artifacts similar to Claude.
- **Bing Web Search**: Provides up-to-date results with Bing Search, similar to Perplexity.ai.
- **Multi-turn Agentic Workflows**: Facilitates complex interactions with multiple turns.
- **Open Source Models**: Integrates with various open-source models.
- **Advanced CoT Logic and Reasoning**: Utilizes advanced Chain-of-Thought logic for better reasoning.
- **Memory**: Remembers previous interactions to provide context-aware responses.
- **Vision**: Supports image recognition and processing.
- **File Upload**: Allows users to upload files for processing.
- **Interactive Web Applications**: Generates interactive web applications using AI within the chat window.
- **Image Search and Generation**: Searches for and generates images using DALLE-3.
- **Interactive Charts**: Creates interactive charts using Mermaid.
- **Slideshow Generation**: Compiles research and images into slideshows.
- **Real-time Information**: Provides up-to-date time and weather information.
- **Customization**: Offers various parameters for customization.
- **Artifact Publication**: Allows users to publish and share artifacts.

## Screenshots
### Choose from several frontier models from a variety of providers such as OpenAI, Anthropic, and Meta
![image](https://github.com/user-attachments/assets/cb5dd68c-f5f7-4b97-b584-9e74a0c267c9)

### Up-to-date results with Bing Search & Wikipedia Integration
![Screenshot 2024-07-26 171138](https://github.com/user-attachments/assets/776d10e6-48c4-4af2-b26f-f6e3592637c5)
![Screenshot 2024-07-28 103827](https://github.com/user-attachments/assets/e8ed87a4-e436-4f15-bb33-bb53a2e9f7aa)
![Screenshot 2024-08-21 000849](https://github.com/user-attachments/assets/e7f5aeef-bd6d-40f2-b146-6cbf8837b1fb)

### Generate interactive web applications using AI inside the chat window with Artifacts
![synapse-chat-paint](https://github.com/user-attachments/assets/0970023f-968d-442b-aba2-1d24708fa8f2)
![Screenshot 2024-08-21 000434](https://github.com/user-attachments/assets/a7dffe18-34af-4d66-bb6c-7e7beb9529d7)
![Screenshot 2024-11-02 195228](https://github.com/user-attachments/assets/7ba689e7-f920-4377-960b-5c036a49cd9a)

### Generate interactive charts using Mermaid
![Screenshot 2024-08-21 001051](https://github.com/user-attachments/assets/c65c2cb5-af45-421a-90e7-9f573a65d271)

### Search for images
![Screenshot 2024-08-21 001135](https://github.com/user-attachments/assets/b0dd4b51-58ea-40fb-bbf9-075e8bbcdb4a)

### Generate slideshows from the research and images compiled or generated in the chat
![Screenshot 2024-08-21 001301](https://github.com/user-attachments/assets/00fa3254-283e-4b95-acdc-bfc3ff5d4cdf)

### Generate charts and graphs to make your data interactive
![Screenshot 2024-11-02 195337](https://github.com/user-attachments/assets/0c70f3ed-6850-4103-a486-a2ffee360e91)

### Generate Images using DALLE-3 Integration
![image](https://github.com/user-attachments/assets/0d318657-bc85-43ef-b108-e82b16aa7667)

### Get up-to-date time and weather information
![image](https://github.com/user-attachments/assets/cac2ab53-d7a5-41ac-b7df-2cad34e1b7a9)

### Customize several parameters
![image](https://github.com/user-attachments/assets/7d9ea2db-787e-4422-a6a8-c6d4fba927ce)

### Publish artifacts and share them with others
![image](https://github.com/user-attachments/assets/a706f5e8-42c8-48f1-87ca-43cdcbb315f4)
![image](https://github.com/user-attachments/assets/b124cd4f-1f2e-4b56-acf9-dd9f576676ae)

## Supported Models

### OpenAI
| Model Name       | Model Key   | Max Tokens |
|-------------------|-------------|------------|
| ChatGPT 4o       | `chatgpt4o` | 16,384     |
| GPT-4o           | `gpt4o`     | 16,384     |
| GPT-4o mini      | `gpt4omini` | 16,384     |
| GPT-4 Turbo      | `gpt4turbo` | 4,096      |
| GPT-4            | `gpt4`      | 8,192      |
| GPT-3.5 Turbo    | `gpt35`     | 4,096      |
| o1               | `o1`        | 100,000    |
| o1-preview       | `o1preview` | 32,768     |
| o1-mini          | `o1mini`    | 65,536     |
| o3-mini          | `o3mini`    | 100,000    |

### Anthropic
| Model Name           | Model Key         | Max Tokens |
|-----------------------|-------------------|------------|
| Claude 3.5 Sonnet    | `claude35sonnet` | 8,192      |
| Claude 3 Opus        | `claude3opus`    | 4,196      |
| Claude 3.5 Haiku     | `claude35haiku`  | 8,192      |

### Azure
| Model Name   | Model Key      | Max Tokens |
|--------------|----------------|------------|
| GPT-4o       | `azureGpt4o`   | 16,384     |

### Groq
| Model Name                           | Model Key                      | Max Tokens |
|--------------------------------------|--------------------------------|------------|
| Llama 3.3 70B Specdec                | `llama33_70b_specdec`         | 8,192      |
| Llama 3.3 70B Versatile              | `llama33_70b_versatile`       | 32,768     |
| Llama 3.2 90B Vision Preview         | `llama32_90b_vision`          | 8,192      |
| Llama 3.2 11B Vision Preview         | `llama32_11b_vision`          | 8,192      |
| Llama 3.1 8B                         | `llama31_8b`                  | 8,000      |
| Mixtral 8x7B                         | `mixtral_8x7b`                | 32,768     |
| Gemma2 9B                            | `gemma2_9b_it`                | 8,192      |
| Deepseek R1 Distill Qwen 32B         | `deepseek_r1_distill_qwen_32b`| 131,072    |
| Deepseek R1 Distill Llama 70B        | `deepseek_r1_distill_llama_70b`| 131,072   |

### Custom Synapse Chat Models
| Model Name   | Model Key    | Max Tokens |
|--------------|--------------|------------|
| MathGPT      | `mathgpt`    | 16,384     |
| Auto         | `auto`       | -          |
| Agents       | `agents`     | -          |
| Reasoning    | `reasoning`  | -          |
