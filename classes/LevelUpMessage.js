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
                            if (typeof val2 == "string") mbedJSON[key][key2] = this.subVariables(val2)
                        }
                    }
                }

                // add vars to fields
                    if (mbedJSON.fields && mbedJSON.fields.length) {
                    mbedJSON.fields = mbedJSON.fields.map(f => ({ name: this.subVariables(f.name), value: this.subVariables(f.value), inline: f.inline }))
                }
                
                this.msg = { embeds: [ mbedJSON ] }
                if (mbed.extraContent) this.msg.content = this.subVariables(mbed.extraContent)
            }
        }

        else this.msg =  { content: this.subVariables(this.msg) }

        if (this.msg) this.msg.reply = { messageReference: message.id }
    }

    subVariables(msg) {

        if (!msg) return msg
        let newMsg = msg.replace(/\n/g, "　")
        let newLevel = this.level

        // simple variables
        let vars = this.variables        
        newMsg = newMsg.replace(/\[\[[A-Z@_ ]+\]\]/g, function(str) {
            let v = str.slice(2, -2).trim()
            return vars[v] ?? str
        })
