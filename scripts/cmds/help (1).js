const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const DIVIDER = "= = = = = = = = = = = = = =";

function makeHeader(title) {
  const divLen = DIVIDER.length;
  const inner = ` ${title} `;
  const fillLen = divLen - inner.length;
  const leftFill = Math.floor(fillLen / 2);
  const rightFill = fillLen - leftFill;
  function eqPad(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += i % 2 === 0 ? "=" : " ";
    return s;
  }
  return eqPad(leftFill) + inner + eqPad(rightFill);
}

module.exports = {
  config: {
    name: "help",
    version: "2.4",
    author: "YourName",
    countDown: 5,
    role: 0,
    description: {
      en: "View all commands or details of a specific command",
    },
    category: "info",
    guide: {
      en:
        "{pn} — show all commands\n" +
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
    if (command) {
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

      const roleMap = { 0: "Everyone", 1: "Group Admin", 2: "Bot Admin" };

      const guideFormatted =
        guide
          .replace(/\{prefix\}|\{p\}/g, prefix)
          .replace(/\{name\}|\{n\}/g, cfg.name)
          .replace(/\{pn\}/g, prefix + cfg.name) || `${prefix}${cfg.name}`;

      const body =
        makeHeader(cfg.name.toUpperCase()) + "\n" +
        `📝 ${description}\n` +
        `👤 ${roleMap[cfg.role] || cfg.role}\n` +
        `✍️ ${cfg.author || "Unknown"}\n` +
        DIVIDER + "\n" +
        `📖 USAGE\n` +
        guideFormatted + "\n" +
        DIVIDER;

      return message.reply(body);
    }

    // ─── Command not found ─────────────────────────────────────────── //
    if (commandName) {
      return message.reply(
        makeHeader("NOT FOUND") + "\n" +
        `"${commandName}" command exists na\n` +
        DIVIDER
      );
    }

    // ─── All commands list ─────────────────────────────────────────── //
    const allCmds = [...commands.values()]
      .filter((cmd) => cmd.config.role <= 1 || role >= cmd.config.role)
      .map((cmd) => cmd.config.name)
      .sort();

    const lines = [];
    for (let i = 0; i < allCmds.length; i += 4) {
      lines.push(" " + allCmds.slice(i, i + 4).join(" • "));
    }

    const body =
      makeHeader("HELP") + "\n" +
      lines.join("\n") + "\n" +
      DIVIDER + "\n" +
      `Commands: ${allCmds.length} • Prefix: ${prefix}`;

    return message.reply(body);
  },
};
