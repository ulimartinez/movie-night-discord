var Discord = require('discord.js');
var auth = require('./auth.json');

var bot = new Discord.Client();

bot.on('ready', () => {
	console.log("Bot %s is ready!", "movie");
});

bot.on('message', (message) => {
	var response = "";
	if(message.channel.name === 'bot-commands'){
		if(message.content.startsWith("!list")){
			message.reply("This is the list of movies");
		} else if(message.content.startsWith("!vote")){
			var parts = message.content.split(" ");
			if(parts.length != 2){
				response = "Usage: !vote [id]";
			}
			else {
				response = "voted for the movie :" + parts[1];
			}
			message.reply(response);
		} else if(message.content.startsWith("!add")){
			var parts = message.content.split(" ");
			if(parts.length < 2){
				response = "Usage: !add [movie]";
			}
			else {
				response = "Adding the movie: " + message.content.replace("!add ", ""); 
			}
			message.reply(response);
		}
	}
});
bot.login(auth.token);
