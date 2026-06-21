const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.handleComponents = async () => {
    const componentsPath = path.join(client.rootDir || process.cwd(), 'src', 'components');
    if (!fs.existsSync(componentsPath)) return;

    const componentFolders = fs.readdirSync(componentsPath).filter((entry) => {
      return fs.statSync(path.join(componentsPath, entry)).isDirectory();
    });

    for (const folder of componentFolders) {
      const folderPath = path.join(componentsPath, folder);
      const componentFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

      for (const file of componentFiles) {
        const component = require(path.join(folderPath, file));
        if (!component?.data?.name || typeof component.execute !== 'function') continue;

        if (folder === 'buttons') client.buttons.set(component.data.name, component);
        if (folder === 'selectMenus') client.selectMenus.set(component.data.name, component);
        if (folder === 'modals') client.modals.set(component.data.name, component);
      }
    }
  };
};
