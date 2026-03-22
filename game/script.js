const firebaseConfig = {
				apiKey: "AIzaSyA7j5cwbeYuDvN9noLUARfnCYA1X7q8EFc",
				authDomain: "ds-chat-system.firebaseapp.com",
				databaseURL: "https://ds-chat-system.firebaseio.com",
				projectId: "ds-chat-system",
				storageBucket: "ds-chat-system.appspot.com",
				messagingSenderId: "853002794624",
				appId: "1:853002794624:web:0a723912b9b23f39431865"
			};
			firebase.initializeApp(firebaseConfig);

			const start_messages = [
				"Let's go!",
				"I'm feeling good!",
				"Here we go!",
				"Time to run!",
				"Let's do this!",
				"I didn't sign up for this...",
				"Why am I running?",
				"Is this really necessary?",
				"I'm just here for the snacks.",
				"I wanna go home.",
				"Can we just walk?",
				"Do I get a medal for this?",
				"Is there a finish line?",
				"The developer sucks!"
			];

			$(document).ready(function() {

				//get URL parameters
				const urlParams = new URLSearchParams(window.location.search);
				const isAdmin = urlParams.get('is_admin');

				if ( !isAdmin ) {
					$('.adminControl').hide();
					$('#start_game').hide();
					$('.screenHero').show();
				}

				$('#add_player, #joinGame').click(function() {

					let getCurrentID = $(this).attr('id');

					var playerName = $('.playerName').val();

					 if ( getCurrentID === 'joinGame' ) {
						playerName = $('#playerNameUser').val();
					 }

					if (playerName) {
						const db = firebase.database();
							db.ref("run_chicken_run").push(
									{
										player_name: playerName,
										pos: 0,
										speed: 20,
										direction: "forward",
										image: "asset-idle.gif",
										message: start_messages[Math.floor(Math.random() * start_messages.length)]
									}
							).then(() => {
								//do nothing
							}).catch((error) => {
								alert("Error:", error);
							});
						$('.playerName').val('');
						$('.screenHero').hide();
					} else {
						alert("Please enter a name!");
					}

					
				});

				$('#restart_game').click(function() {
					const db = firebase.database();
					db.ref("run_chicken_run").remove().then(() => {
						//do nothing
					}).catch((error) => {
						alert("Error:", error);
					});
					db.ref("Results").remove().then(() => {
						//do nothing
					}).catch((error) => {
						alert("Error:", error);
					});
					$('#raceResult').html('');
				});

				$('#start_game').click(function() {
					// Move the img to the right
					playMusic();

					const db = firebase.database();
					const gameRef = db.ref("run_chicken_run");
					$('.raceTrack .raceElement').each(function(index) {
						var raceEl = $(this);
						var parentWidth = raceEl.parent().width();
						var imgWidth = raceEl.find('img').width();
						var maxDistance = parentWidth - imgWidth; // max distance it can move

						var cur_image = 'asset-idle.gif';
						
						var img = raceEl.find('img');
						img.prop('src','asset-run.gif'); 
						cur_image = 'asset-run.gif';
			

						var currentPos = 0; // starting position
						var intervalTime = 100; // how often to update position (ms)
						
						var speeds = [25, 12, 0, 7, 27, 5, 22, 9, 0, 12, 17, 0]; // pixels per interval
						var speedIndex = 0;

						var directions = ["forward", "back", "forward", "forward", "forward", "forward"];
						
						var current_direction = "forward";

						var message = '';

						// change speed every 2 seconds
						var speedChanger = setInterval(function() {
							speedIndex = Math.floor(Math.random() * speeds.length);
							if ( speeds[speedIndex] === 0 ) {
								img.prop('src','asset-idle.gif'); // change to idle if speed is 0
								cur_image = 'asset-idle.gif';
								message = 'I need a break!';
							} else {
								img.prop('src','asset-run.gif'); // change to run if speed is > 0
								cur_image = 'asset-run.gif';
								message = '';
							}

							direction_index = Math.floor(Math.random() * directions.length);
							current_direction = directions[direction_index];
							if ( directions[direction_index] === "back" && speeds[speedIndex] > 0 ) {
								img.prop('src','asset-run-back.gif');
								cur_image = 'asset-run-back.gif';
								message = 'F*** this!';
							}

							if ( directions[direction_index] === "back" && speeds[speedIndex] === 0 ) {
								img.prop('src','asset-idle-back.gif');
								cur_image = 'asset-idle-back.gif';
								message = 'What\'s that?';
							}

							if ( speeds[speedIndex] === 27 && directions[direction_index] !== "back") {
								message = 'Faster than the speed of light!';
							}

							if ( (speeds[speedIndex] === 22 || speeds[speedIndex] === 25 ) && directions[direction_index] !== "back" ) {
								message = 'Eat my dust!';
							}

							if ( speeds[speedIndex] === 17 && directions[direction_index] !== "back") {
								message = 'Gas! Gas! Gas!';
							}

							if ( speeds[speedIndex] === 12 && directions[direction_index] !== "back") {
								message = 'Mind the speed limit!';
							}

							if ( speeds[speedIndex] === 7 && directions[direction_index] !== "back") {
								message = 'Chill, gas is expensive!';
							}

						}, 2000);

						var anim = setInterval(function() {
							if ( current_direction === 'forward' ) {
								currentPos += speeds[speedIndex] * (intervalTime / 1000); // move according to current speed
							} else if ( current_direction === 'back' ) {
								currentPos -= ( speeds[speedIndex] * (intervalTime / 1000) ) * 2; // move backwards according to current speed
								if (currentPos < 0) currentPos = 0; // don't go past start
							}
							currentPos += speeds[speedIndex] * (intervalTime / 1000); // move according to current speed
							if(currentPos >= maxDistance){
								currentPos = maxDistance;
								clearInterval(anim);
								clearInterval(speedChanger);
								img.prop('src','asset-idle.gif'); // change to idle at end
								cur_image = 'asset-idle.gif';
								message = 'I made it!';

								addLeaderBoard(raceEl.find('img').data('name'));

							}

							// Update the position in Firebase
							const chickID = raceEl.data('id');
							gameRef.child(chickID).set({
								player_name: raceEl.find('img').data('name'),
								pos: currentPos,
								speed: speeds[speedIndex],
								direction: current_direction,
								image: cur_image,
								message: message
							});

							raceEl.css('left', currentPos + 'px');
						}, intervalTime);

					});
				});

				$('#reset_game').click(function() {
					const db = firebase.database();
					const gameRef = db.ref("run_chicken_run");
					gameRef.once("value", (snapshot) => {
						const data = snapshot.val();
						if (data) {
							Object.keys(data).forEach((key) => {
								gameRef.child(key).set({
									player_name: data[key].player_name,
									pos: 0,
									speed: 30,
									direction: "forward",
									image: "asset-idle.gif",
									message: start_messages[Math.floor(Math.random() * start_messages.length)]
								});
							});
						}
					});
					db.ref("Results").remove().then(() => {
						//do nothing
					}).catch((error) => {
						alert("Error:", error);
					});
					$('#raceResult').html('');
				});

				$('#hideHero').click(function() {
					$('.screenHero').hide();
				});

			

			});

			function isPlaying(audio) {
				return !audio.paused && !audio.ended && audio.currentTime > 0;
			}

			
			function playMusic(mode = 'play') {
				const audio = document.getElementById('bgmusic');
				audio.volume = 0.5;

				switch(mode) {
					case 'play':
						if ( !isPlaying(audio) ) {
							audio.play();
						}
						break;
					default:
						audio.pause();
						audio.currentTime = 0;
						break
				}
			}

			LoadDataFromFirebase();

			function LoadDataFromFirebase() {
				const db = firebase.database();
				const gameRef = db.ref("run_chicken_run");
				gameRef.on("value", (snapshot) => {
					const data = snapshot.val();

					const container = document.getElementById("gameData");
					container.innerHTML = ""; // clear old data

					if (data) {
						Object.keys(data).forEach((key) => {
							const player = data[key];

							const div = document.createElement("div");
							let message_status = (player.message != '') ? 'active' : '';
							div.innerHTML = `
							<div class="raceTrack">
								<span class="playerNameLabel">${player.player_name}</span>
								<div class="raceElement" data-id="${key}" style="left: ${player.pos}px;">
									<span class="chickBubble ${message_status}">${player.message}</span>
									<img src="${player.image}" data-name="${player.player_name}" width="40">
								</div>
								<img src="flag.png" class="finishLine">
							</div>
							`;
							container.appendChild(div);
						});
					}
				});
			}

			function addLeaderBoard(winnerName) {
				const db = firebase.database();
				const leaderboardRef = db.ref("Results");
				leaderboardRef.push({
					name: winnerName
				});

				//get leaderboard count elements using jquery
				const leaderboardCount = $('#raceResult span').length;
				const playercount = $('#gameData .raceTrack').length;

				if ( leaderboardCount >= playercount ) {
					playMusic('stop');
				}
			}

			LoadLeaderBoard();

			function LoadLeaderBoard() {
				const db = firebase.database();
				const leaderboardRef = db.ref("Results");
				leaderboardRef.on("value", (snapshot) => {
					const data = snapshot.val();
					const container = document.getElementById("raceResult");
					container.innerHTML = ""; // clear old data
					if (data) {
						let rank_num = 0;
						
						Object.keys(data).forEach((key) => {
							const entry = data[key];
							const div = document.createElement("span");
							rank_num++;
							div.textContent = `${rank_num}. ${entry.name}`;
							container.appendChild(div);
						});
					}
				});
			}