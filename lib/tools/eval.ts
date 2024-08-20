import vm from "vm";

const executeJavaScript = (code: string) => {
    try {
        const result = vm.runInNewContext(code);
        return { success: true, result };
    } catch (error) {
        const errorMessage = (error as Error).message || error;
        return { success: false, error: errorMessage };
    }
}

export default executeJavaScript;