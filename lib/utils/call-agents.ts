const callAgents = async (prompt: string) => {
    try {
        const response = await fetch("/api/agents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("\n\n### FINAL RESULT");
        console.log(JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Error calling agents:", error);
        return [];
    }
};

export default callAgents;