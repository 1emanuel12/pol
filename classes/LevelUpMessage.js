const ordinal = require('ordinal/indicator');
const LevelUpEmbed = require("./LevelUpEmbed.js")
const Tools = require("./Tools.js")
const tools = Tools.global

const ifLevelRegex = /\[\[\s*IFLEVEL\s*([=></!%]+)\s*(\d+)\s*\|(.+?)\]\]/
const ordinalRegex = /(\d+)(\s*)\[\[\s*NTH\s*\]\]/

class LevelUpMessage {
    constructor(settings, message, data={}) {

        this.channel = settings.levelUp.channel
        this.msg = settings.levelUp.message
        this.userMessage = message
        this.level = data.level

        let roleList = data.roleList || message.guild.roles.cache
        this.rewardRoles = settings.rewards.filter(x => x.level == data.level).map(x => roleList.find(r => r.id == x.id)).filter(x => x)

        if (settings.levelUp.rewardRolesOnly && !this.rewardRoles.length && !data.example) {
            this.invalid = true;
            return
        }
        
        this.variables = {
            "LEVEL": tools.commafy(data.level),
            "OLD_LEVEL": tools.commafy(data.oldLevel ?? data.level - 1),
            "XP": tools.commafy(data.userData.xp),
            "NEXT_LEVEL": Math.min(data.level + 1, settings.maxLevel),
            "NEXT_XP": tools.commafy(tools.xpForLevel(data.level + 1, settings) - data.userData.xp),
            "@": `<@${message.author.id}>`,
            "USERNAME": message.author.username,
            "DISPLAYNAME": message.author.displayName,
            "DISCRIM": message.author.discriminator,
            "ID": message.author.id,
            "NICKNAME": message.member.displayName,
            "AVATAR": message.member.avatarLink || message.member.displayAvatarURL({format: "png", dynamic: true}),
            "SERVER": message.guild.name,
            "SERVER_ID": message.guild.id,
            "SERVER_ICON": message.guild.iconLink || message.guild.iconURL({format: "png", dynamic: true}) || "", 
            "CHANNEL": `<#${message.channel.id}>`,
            "CHANNEL_NAME": message.channel.name,
            "CHANNEL_ID": message.channel.id,
            "ROLE": this.rewardRoles.map(x => `<@&${x.id}>`).join(" "),
            "ROLE_NAME": this.rewardRoles.map(x => x.name).join(", "),
            "TIMESTAMP": Math.round(Date.now() / 1000),
            "EMBEDTIMESTAMP": new Date().toISOString()
        }

        if (settings.levelUp.embed) {
            let mbed = new LevelUpEmbed(this.msg)
            if (mbed.invalid) {
                this.msg = ""
                this.invalid = true
            }
            else {
                let mbedJSON = mbed.json(false)

                // add vars to all strings
                for (const [key, val] of Object.entries(mbedJSON)) {
                    if (typeof val == "string") mbedJSON[key] = this.subVariables(val)

                    // go one extra layer deep lmao
                    else if (val && typeof val == "object" && !Array.isArray(val)) {
                        for (const [key2, val2] of Object.entries(val)) {
