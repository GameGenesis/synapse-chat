const showdownImage: showdown.ShowdownExtension = {
    type: 'output',
    filter: (text: string) => {
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
      return text.replace(imgRegex, (match, src) => {
        return `___CUSTOM_IMAGE_${encodeURIComponent(
            src
        )}___`;
    });
    }
  };

export default showdownImage;