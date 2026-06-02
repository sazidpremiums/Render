const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
config: {
name: "help2",
version: "2.0",
author: "Sazid",
countDown: 5,
role: 0,
shortDescription: {
en: "View all commands"
},
longDescription: {
en: "Display all commands and command usage"
},
category: "info",
guide: {
en: "{pn}help [command]"
}
},

```
onStart: async function ({ message, args, event, role }) {
	const prefix = getPrefix(event.threadID);

	if (!args[0]) {
		const categories = {};

		for (const [name, cmd] of commands) {
			if (cmd.config.role > role) continue;

			const category = cmd.config.category || "other";

			if (!categories[category])
				categories[category] = [];

			categories[category].push(name);
		}

		let msg = `┌─〔 🤖 ${global.GoatBot.config.nickNameBot || "GOAT BOT"} 〕\n`;
		msg += `│\n`;
		msg += `│ Welcome to Command Center\n`;
		msg += `│\n`;

		const sortedCategories = Object.keys(categories).sort();

		for (const category of sortedCategories) {
			const cmdList = categories[category].sort();

			msg += `├ ${category.toUpperCase()} (${cmdList.length})\n`;
			msg += `│ › ${cmdList.join(", ")}\n`;
			msg += `│\n`;
		}

		msg += `├─────────────────────\n`;
		msg += `│ Total Commands : ${commands.size}\n`;
		msg += `│ Prefix         : ${prefix}\n`;
		msg += `│ Usage          : ${prefix}help <command>\n`;
		msg += `└─────────────────────\n\n`;

		msg += `👑 Owner : Sazid\n`;
		msg += `🤖 Bot   : ${global.GoatBot.config.nickNameBot || "GOAT BOT"}`;

		return message.reply(msg);
	}

	const commandName = args[0].toLowerCase();

	const command =
		commands.get(commandName) ||
		commands.get(aliases.get(commandName));

	if (!command) {
		return message.reply(
			`❌ Command "${commandName}" not found.`
		);
	}

	const config = command.config;

	const roleText = roleTextToString(config.role);

	const description =
		config.longDescription?.en ||
		config.shortDescription?.en ||
		"No description";

	const usage =
		config.guide?.en
			?.replace(/{p}/g, prefix)
			?.replace(/{n}/g, config.name)
		|| "No guide available";

	const response = `┌─〔 ${config.name.toUpperCase()} 〕
```

├ Description
│ ${description}

├ Information
│ Version  : ${config.version || "1.0"}
│ Role     : ${roleText}
│ Cooldown : ${config.countDown || 0}s
│ Author   : ${config.author || "Unknown"}

├ Aliases
│ ${config.aliases?.join(", ") || "None"}

├ Usage
│ ${usage}

└ End`;

```
	return message.reply(response);
}
```

};

function roleTextToString(role) {
switch (role) {
case 0:
return "All Users";
case 1:
return "Group Admin";
case 2:
return "Bot Admin";
default:
return "Unknown";
}
}
