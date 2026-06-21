const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.handleEvents = async () => {
    const eventsPath = path.join(client.rootDir || process.cwd(), 'src', 'events');
    if (!fs.existsSync(eventsPath)) return;

    const eventFolders = fs.readdirSync(eventsPath).filter((entry) => {
      return fs.statSync(path.join(eventsPath, entry)).isDirectory();
    });

    for (const folder of eventFolders) {
      const folderPath = path.join(eventsPath, folder);
      const eventFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

      for (const file of eventFiles) {
        const filePath = path.join(folderPath, file);
        const event = require(filePath);
        if (!event?.name || typeof event.execute !== 'function') {
          console.warn(`Skipped event ${folder}/${file}: missing name or execute.`);
          continue;
        }

        const runner = (...args) => event.execute(...args, client);
        if (folder === 'database' && client.connections?.core) {
          if (event.once) client.connections.core.once(event.name, runner);
          else client.connections.core.on(event.name, runner);
        } else if (event.once) {
          client.once(event.name, runner);
        } else {
          client.on(event.name, runner);
        }

        console.log(`Loaded event: ${folder}/${event.name}`);
      }
    }
  };
};
