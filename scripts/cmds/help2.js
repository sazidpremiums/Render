const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const CATEGORY_ICONS = {
  info: "📖",
  fun: "🎮",
  utility: "🛠",
  admin: "👑",
  game: "🕹",
  media: "🎵",
  economy: "💰",
  social: "💬",
  nsfw: "🔞",
  other: "📦",
};

module.exports = {
  config: {
    name: "help2",
    version: "2.0",
    author: "Sazid",
    countDown: 5,
    role: 0,
    description: {
      en: "View all commands or usage of a specific command",
    },
    category: "info",
    guide: {
      en:
        "{pn} — show all commands (category view)\n" +
        "{pn} -n — show all commands (name/alphabetical view)\n" +
        "{pn} <command name> — show details for a command",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const threadData = await threadsData.get(threadID);
    const aliasesData = threadData?.data?.aliases || {};

    const commandName = (args[0] || "").toLowerCase();
    const flagName = args[0] === "-n";

    // ─── Resolve command ───────────────────────────────────────────── //
    let command =
      commands.get(commandName) || commands.get(aliases.get(commandName));

    if (!command && commandName) {
      for (const cmdName in aliasesData) {
        if ((aliasesData[cmdName] || []).includes(commandName)) {
          command = commands.get(cmdName);
          break;
        }
      }
    }

    // ─── Show command detail ───────────────────────────────────────── //
    if (command && !flagName) {
      const cfg = command.config;
      const lang =
        (await threadsData.get(threadID, "data.lang")) ||
        global.GoatBot.config.language ||
        "en";
      const guide =
        (typeof cfg.guide === "object"
          ? cfg.guide[lang] || cfg.guide.en
          : cfg.guide) || "";
      const description =
        (typeof cfg.description === "object"
          ? cfg.description[lang] || cfg.description.en
          : cfg.description) || "No description";
      const aliasStr =
        cfg.aliases && cfg.aliases.length ? cfg.aliases.join(", ") : "None";
      const threadAliasStr =
        aliasesData[cfg.name] && aliasesData[cfg.name].length
          ? aliasesData[cfg.name].join(", ")
          : "None";
      const roleMap = { 0: "Everyone", 1: "Group Admin", 2: "Bot Admin" };
      const guideFormatted = guide
        .replace(/\{prefix\}|\{p\}/g, prefix)
        .replace(/\{name\}|\{n\}/g, cfg.name)
        .replace(/\{pn\}/g, prefix + cfg.name)
        .split("\n")
        .map((l) => `│ ${l}`)
        .join("\n");

      const body =
        `╭─ 📌 ${cfg.name.toUpperCase()} ─╮\n` +
        `│ 📝 ${description}\n` +
        `│ 🏷 Alias: ${aliasStr}\n` +
        `│ 👤 Role: ${roleMap[cfg.role] || cfg.role}\n` +
        `│ ⏱ Cooldown: ${cfg.countDown || 1}s\n` +
        `│ ✍️ Author: ${cfg.author || "Unknown"}\n` +
        `├─ 📖 USAGE\n` +
        `${guideFormatted || `│ ${prefix}${cfg.name}`}\n` +
        `╰${"─".repeat(14)}╯`;

      return message.reply(body);
    }

    // ─── Alphabetical list view (-n flag) ─────────────────────────── //
    if (flagName || (args[0] && !command)) {
      const sorted = [...commands.values()]
        .filter((cmd) => cmd.config.role <= 1 || role >= cmd.config.role)
        .map((cmd) => cmd.config.name)
        .sort();

      const chunkSize = 5;
      const lines = [];
      for (let i = 0; i < sorted.length; i += chunkSize) {
        lines.push("│ " + sorted.slice(i, i + chunkSize).join(" • "));
      }

      const body =
        `╭─ 📋 ALL COMMANDS ─╮\n` +
        lines.join("\n") +
        `\n├${"─".repeat(19)}╮\n` +
        `│ Commands: ${sorted.length} • Prefix: ${prefix}\n` +
        `╰${"─".repeat(20)}╯`;

      return message.reply(body);
    }

    // ─── Category view (default) ───────────────────────────────────── //
    const categoryMap = {};

    for (const [, cmd] of commands) {
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      const cat = (cmd.config.category || "other").toLowerCase();
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(cmd.config.name);
    }

    const sortedCats = Object.keys(categoryMap).sort();

    let body = `╭─ 📖 HELP ─╮\n`;

    for (const cat of sortedCats) {
      const icon = CATEGORY_ICONS[cat] || "📦";
      const names = categoryMap[cat].sort();
      const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
      const nameLines = [];
      for (let i = 0; i < names.length; i += 4) {
        nameLines.push("│ " + names.slice(i, i + 4).join(" • "));
      }
      body += `${icon} ${catTitle}\n${nameLines.join("\n")}\n`;
    }

    const totalCommands = [...commands.values()].filter(
      (cmd) => cmd.config.role <= 1 || role >= cmd.config.role
    ).length;

    body +=
      `╰${"─".repeat(14)}╯\n` +
      `Commands: ${totalCommands} • Prefix: ${prefix}`;

    return message.reply(body);
  },
};
