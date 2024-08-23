import vm from "vm";

const executeJavaScript = (code: string, timeout = 2000) => {
    try {
        const sandbox = {}
        const context = vm.createContext(sandbox);
        const result = vm.runInNewContext(code, context, { timeout: timeout });
        return { success: true, result };
    } catch (error) {
        const errorMessage = (error as Error).message || error;
        return { success: false, error: errorMessage };
    }
};

export default executeJavaScript;
