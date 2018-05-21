const fs = require('fs')
const nodeCleanup = require('node-cleanup')

const bot = {}
bot.config = require('./config')
bot.git = require('simple-git')()

bot.discord = require('./modules/discordbot').init(bot)

bot.irc = require('./modules/prebot').init(bot)
bot.rss = require('./modules/rssbot').init(bot)

process.stdout.w = process.stdout.write
let log = fs.createWriteStream('./node.log')
process.stdout.write = process.stderr.write = out => {
  process.stdout.w(out)
  log.write(out.replace(/\u001B\[\d+m/g, ''))
}

nodeCleanup((exitCode, signal) => {
  console.log('starting Cleanup')
  irc.client.disconnect('Ill be back.', () => {
    console.log('Disconected Irc')
  })
})
