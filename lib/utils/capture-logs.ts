export const captureConsoleLogs = (iframe: HTMLIFrameElement, callback: (log: string) => void) => {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const originalConsole = window.console;
        window.console = {
          log: function(...args) {
            window.parent.postMessage({type: 'console.log', args: args}, '*');
            originalConsole.log.apply(this, args);
          },
          warn: function(...args) {
            window.parent.postMessage({type: 'console.warn', args: args}, '*');
            originalConsole.warn.apply(this, args);
          },
          error: function(...args) {
            window.parent.postMessage({type: 'console.error', args: args}, '*');
            originalConsole.error.apply(this, args);
          }
        };
      })();
    `;
    
    iframe.contentDocument?.head?.appendChild(script);
  
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow) {
        const { type, args } = event.data;
        if (type.startsWith('console.')) {
          const formattedArgs = args.map((arg: any) => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          callback(`[${type.split('.')[1].toUpperCase()}] ${formattedArgs}`);
        }
      }
    };
  
    window.addEventListener('message', handleMessage);
  
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  };