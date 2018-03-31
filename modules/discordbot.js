const discord = require('discord.js')

class GoodBot {
  constructor () {
    this.client = new discord.Client()
    this.bot = require('./bot')

    /*
     * -- Define Handle Functions --
     */
    this.handle = {
      ready: msg => {
        /*
         * -- Define Channels --
         */
        this.channels = {
          request: this.client.channels.find('name', 'megarequest'),
          requested: this.client.channels.find('name', 'megarequested'),
          filled: this.client.channels.find('name', 'megafilled')
        }

        // init bot.js module
        this.bot.init(this.client)
      },

      message: msg => {
        if (msg.channel.type === 'text') {
          // check for valide command
          for (var command in this.commands) {
            let regex = new RegExp(`^!${command}\b`)
            if (regex.test(msg.content)) {
              this.bot.work += 10
              msg.content = msg.content.replace(regex, '').trim()

              // call command handle function
              return this.commands[command](msg)
            }
          }
        }
      },

      parseArgs: msg => {
        let args = msg.content.split(';')
        args.forEach((el, i) => { args[i] = el.trim() })
        return args
      },

      request: msg => {
        let args = this.handle.parseArgs(msg)
        const [type, title, quality, host, link] = args

        const embedErr = new discord.RichEmbed()
          .addField('Usage:', '!request <request type>; <title>; <quality>; <preferred host>; <relevant link>')
          .addField('Example:', '!request Movie; Monsters Inc.; 1080p or higher, x265; MEGA; http://www.imdb.com/title/tt1319735')
          .setColor('RED')

        // check if has enough args
        if (args.length < 5) {
          return msg.reply('You didn\'t fill out all of the items!', {embed: embedErr})
        }

        // check if link parameter is valide url
        if (!/^[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/.test(link)) {
          return msg.reply('invalide parameter: <relevant link>', {embed: embedErr})
        }

        const embed = new discord.RichEmbed()
          .setAuthor(`New Request`, 'https://i.imgur.com/Rgqkjde.png')
          .setThumbnail(msg.author.avatarURL)
          .addField('Requester:', msg.author.toString())
          .addField('Type:', type)
          .addField('Title:', title)
          .addField('Quality:', quality)
          .addField('Preferred Host:', host)
          .addField('Relevant Link:', link)

        this.channels.requested.send({embed}).then(request => {
          embed.addField('Request ID:', `${msg.id}-${request.id}`)
          request.edit({embed})
        })
      },

      filled: msg => {
        // parse command
        let args = this.handle.parseArgs(msg)
        let [requestId, cryptobin, title, notes] = args

        const embedErr = new discord.RichEmbed()
          .addField('Usage:', '!filled <request id>; <cryptobin-url>; <title>; optional:<notes>')
          .addField('Example:', '!filled 427912129794801664-427912129794805678; https://cryptobin.co/e2e4j6w6; tv show; reddit link => ...')
          .setColor('RED')

        // check if request id is valide
        if (!/^\d{18}-\d{18}$/.test(requestId)) {
          return msg.reply('invalide parameter: <request id>', {embed: embedErr})
        }
        // parse request id
        let [messageId, embedId] = requestId.split('-')

        // check if has enough args
        if (args.length < 3) {
          return msg.reply('You didn\'t fill out all of the items!', {embed: embedErr})
        }

        // check if cryptobin parameter is valide site url or valide cryptobin-id
        if (!/^http(s)?:\/\/cryptobin\.co\/[\w\d]{8}$/.test(cryptobin)) {
          if (/^[\w\d]{8}$/.test(cryptobin)) {
            cryptobin = `https://cryptobin.co/${cryptobin}`
          } else {
            return msg.reply('invalide parameter: <cryptobin-url>', {embed: embedErr})
          }
        }

        const embed = new discord.RichEmbed()
          .setAuthor(`New Release`, 'https://i.imgur.com/y2K1AVi.png')
          .setThumbnail(msg.author.avatarURL)
          .addField('Filled By:', msg.author.toString())
          .addField('Title:', title)
          .addField('Cryptobin:', cryptobin)
          .addField('Password:', '```megalinks```')

        // check if has notes parameter
        if (notes) {
          embed.addField('Notes:', notes)
        }

        this.channels.filled.send({embed})

        this.channels.requested.fetchMessage(embedId).then(requestMsg => {
          let requestEmbed = requestMsg.embeds[0]

          // remove json circular structures
          delete requestEmbed.thumbnail.embed
          requestEmbed.fields.forEach(field => {
            delete field.embed
          })

          // check if embed has enough space for the new fields
          if (requestEmbed.fields.length + 5 > 25) { return }

          // create new embed using existing json data
          let newEmbed = new discord.RichEmbed({
            thumbnail: requestEmbed.thumbnail,
            fields: requestEmbed.fields
          })

          // add Filled fields & Set color
          newEmbed.setColor('GREEN')
            .addBlankField()
            .addField('Filled By:', msg.author.toString())
            .addField('Cryptobin:', cryptobin)
            .addField('Password:', '```megalinks```')

          if (notes) {
            newEmbed.addField('Notes:', notes)
          }
          requestMsg.edit({embed: newEmbed})
        })
      }
    }

    this.commands = {
      /*
       * -- Define Commands --
       */
      request: this.handle.request,
      fill: this.handle.filled,
      filled: this.handle.filled
    }
  }

  init (token) {
    this.client.login(token)

    this.client.on('error', console.error)
    this.client.on('ready', this.handle.ready)
    this.client.on('message', this.handle.message)
  }
}

module.exports = new GoodBot()
