var Discord = require('discord.js');
var FormData = require('form-data');
var axios = require('axios');
var mysql = require('mysql');
var auth = require('./auth.json');

var bot = new Discord.Client();
var conn = mysql.createConnection({
	host: auth.mysqlHost,
	user: auth.mysqlUser,
	password: auth.mysqlPassword,
	database: auth.mysqlDB
});
conn.connect();

bot.on('ready', () => {
	console.log("Bot %s is ready!", "movie");
});

var user_data = undefined;
var base = "http://192.168.2.9:3000/api/";

function listMovies(userid, message){
	getUser(userid, message).then(()=>{
		console.log(user_data.token);
		axios.get(base + "movies/list/" + user_data.group, { headers: {'Authorization': user_data.token}}).then((response)=>{
			console.log(response.data.submissions);
			var elements = response.data.submissions;
			for(let i = 0; i < elements.length; i++){
				var embed = new Discord.MessageEmbed().setTitle("Movies");
				embed.addFields(
					{"name": "Movie", "value": elements[i].title},
					{"name": "votes", "value": elements[i].votes, inline:true},
					{"name": "id", "value": elements[i].id, inline:true}
				);
				message.channel.send(embed);
			}
		});
	});
}

function addMovie(userid, message){
	getUser(userid, message).then(()=>{
		var movie = message.content.replace("!add ", "");
		var form = new FormData();
		form.append("name", movie);
		axios.post(base + "movies/submit/"+user_data.group, {"movie": {"name": movie}}, {headers:{"Authorization": user_data.token, "content-type": "application/json"}}).then((response)=>{
			message.reply("Added " + movie);
		}).catch((e)=>{
			console.log(e.response);
		});
	});
}

function voteMovie(userid, message){
	getUser(userid, message).then(()=>{
		var parts = message.content.split(" ");
		console.log(parts[1]);
		axios.post(base + "movies/vote/" + parts[1], null, {headers:{"Authorization": user_data.token}}).then(()=>{
			message.reply("Voted for movie");
			console.log(response);
		}).catch((e)=>{
			console.log(e.response);
			if(e.response.data.errors.date.includes("vote")){
				message.reply("You dont have any votes yet");
			}
		});
	});
}
async function getUser(userid, message) {
	var query = new Promise((resolve, reject)=>{
		conn.query("SELECT * FROM discord_models WHERE userid = '"+userid+"'", (error, res, fields) => {
			if(res.length <= 0){
				console.log("user does not exist");
				message.reply(
					"Looks like you havent linked your BASED movie nights account. " +
					"Please login to the movie nights website and link your discord account.");
				user_data = undefined;
				return reject("database", "user does not exist");
			}
			console.log(res);
			if(!message.content.startsWith("!group") && res[0].group <= 0){
				message.reply("Huh, looks like I don't know which group you're in, go ahead and tell me with !group");
				console.log("no group");
				user_data = undefined;
				return reject("database", "no group specified");
			} else {
				user_data = res[0];
				resolve();
			}
		});
	});
	await query;
}

async function setGroup(userid, message) {
	getUser(userid, message).then(()=>{

		if(!user_data){
			message.reply("Have you linked your discord account in movie nights yet?");
			console.log(user_data);
			return;
		}
		var parts = message.content.split(" ");
		if(parts.length != 2){
			message.reply("Usage: !group [groupId]");
			return;
		}
		var sql = "UPDATE discord_models SET `group`="+parts[1]+" WHERE `userid`='"+userid+"'";
		conn.query(sql, (error, res, fields)=>{
			if(error){
				console.log("error inserting");
				console.log(sql);
				message.reply("there was an error updating the group");
			} else {
				message.reply("Great! now I know what group you're in. Carry on, young one");
			}
		});
	});
}

bot.on('message', (message) => {
	var response = "";
	if(message.channel.name === 'bot-commands'){
		if(message.content.startsWith("!list")){
			listMovies(message.author.id, message);
		} else if(message.content.startsWith("!vote")){
			var parts = message.content.split(" ");
			if(parts.length != 2){
				message.reply("Usage: !vote [id]");
			}
			else {
				voteMovie(message.author.id, message);
			}
		} else if(message.content.startsWith("!add")){
			var parts = message.content.split(" ");
			if(parts.length < 2){
				message.reply("Usage: !add [movie]");
			}
			else {
				addMovie(message.author.id, message);
			}
		} else if(message.content.startsWith("!group")){
			getUser(message.author.id, message);
			var parts = message.content.split(" ");
			if(parts.length != 2){
				console.log(parts);
				message.reply("Usage: !group [groupId]");
			} else {
				setGroup(message.author.id, message);
			}
		}
	}
});
bot.login(auth.token);
