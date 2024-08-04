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
        const data = await response.json();
        console.log(JSON.stringify(data));
        return data;
    } catch (error) {
        return {};
    }
};

export default callAgents;
