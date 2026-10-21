import { useEffect, useState } from 'react';

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const usePwaInstall = () => {
  const [installed, setInstalled] = useState(isStandalone);
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const media = window.matchMedia('(display-mode: standalone)');
    const handleDisplayMode = () => setInstalled(isStandalone());

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    media.addEventListener?.('change', handleDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      media.removeEventListener?.('change', handleDisplayMode);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') setPrompt(null);
    return choice.outcome === 'accepted';
  };

  return { installed, canPrompt: Boolean(prompt), install };
};
