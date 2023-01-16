import React, { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import moment from "moment/moment";

let mqtt = require("mqtt/dist/mqtt");

let randonNumber = Math.floor(Math.random() * 100);
let now = moment().format("MMM Do YYYY, h:mm:ss a");
let options = {
	protocol: "mqtts",
	// clientId uniquely identifies client
	// choose any string you wish
	clientId: `${now}${randonNumber}`,
};
let client = mqtt.connect("mqtt://test.mosquitto.org:8081", options);

// preciouschicken.com is the MQTT topic
// client.subscribe("PIM/62/GPSThesis/1");

function App() {
	const [lat, setLat] = useState("");
	const [lng, setLng] = useState("");
	const [speed, setSpeed] = useState("");
	const [str, setStr] = useState("");

	const [statusMQTT, setStatusMQTT] = useState("");
	const [serialNumber, setSerilNumber] = useState("");
	const [serialNumberText, setSerilNumberText] = useState("");
	const [subTopic, setSubtopic] = useState("");
	const mainTopic = "PIM/62/GPSThesis/";

	const [submit, setSubmit] = useState(false);

	const handleChange = (event) => {
		setSerilNumber(event.target.value);
		console.log(event.target.value);
	};
	async function handleChick() {
		console.log("ok");
		await setStatusMQTT("MQTT connected");
		await setSubmit(true);
		await setSerilNumberText(serialNumber);
		await setSubtopic(`${mainTopic}${serialNumber}`);
		console.log(subTopic);
	}

	const handleDisconnect = () => {
		setSubmit(false);
		setSerilNumberText("");
		setSubtopic("");
		setStatusMQTT("MQTT disconnect");
		client.end();
		console.log("disconnect");
		window.location.reload();
	};

	async function getPosition() {
		await navigator.geolocation.getCurrentPosition((position) => {
			// console.log(position.coords);
			// console.log("1");
			setLat(position.coords.latitude);
			setLng(position.coords.longitude);
			// setSpeed(position.coords.speed);
			if (position.coords.speed == null) {
				setSpeed(0);
			} else {
				let speedMpS = position.coords.speed;
				let speedKmph = speedMpS * 3.6;
				setSpeed(speedKmph);
			}
		});

		if (lat && lng) {
			//   client.publish(subTopic, str);
			console.log("true");
			await set_str(lat, lng, speed);
		} else {
			console.log(
				"Latitude, longitude, or speed not available, data will not be sent via MQTT",
				lat,
				lng,
				speed,
			);
		}
	}

	async function set_str(lat, lng, speed) {
		let strLat = JSON.stringify(lat);
		let strLng = JSON.stringify(lng);
		let strSpeed = JSON.stringify(speed);

		// console.log("lat");
		// console.log("lng");
		// console.log("speed kg/hr");
		// console.log("SN 10");

		let params = {
			SN: serialNumberText,
			lat: strLat,
			lng: strLng,
			speed: strSpeed,
		};
		// console.log(params);
		let strParams = JSON.stringify(params);
		setStr(strParams);
		// return { strParams };
		console.log(`${now}${randonNumber}`);
	}

	useEffect(() => {
		const interval = setInterval(() => {
			if (submit) {
				getPosition();
				// console.log("connecting");

				client.on("connect", () => {
					console.log("connected to MQTT broker");
					setStatusMQTT("MQTT connected");
				});

				client.on("offline", () => {
					console.log("offline from MQTT broker");
					setStatusMQTT("MQTT disconnect");
				});

				client.publish(subTopic, str, function (err) {
					if (!err) {
						console.log("publishing message");
					} else {
						console.log(err);
						alert(err);
					}
				});
			}
		}, 500);
		return () => clearInterval(interval);
	});

	//get current location
	const { coords, isGeolocationAvailable, isGeolocationEnabled } =
		useGeolocated({
			positionOptions: {
				enableHighAccuracy: false,
			},
			userDecisionTimeout: 5000,
		});

	return !isGeolocationAvailable ? (
		<div>Your browser does not support Geolocation</div>
	) : !isGeolocationEnabled ? (
		<div>Geolocation is not enabled</div>
	) : coords ? (
		<div className='flex justify-center'>
			<div className='p-6'>
				<div className='flex flex-row justify-between'>
					<TextField
						required
						id='standard-basic'
						label='Input Serial Number'
						variant='standard'
						size='small'
						onChange={handleChange}
					/>
					<Button
						variant='contained'
						size='small'
						onClick={() => {
							handleChick();
						}}>
						connect
					</Button>
					<Button
						variant='outlined'
						size='small'
						onClick={() => {
							handleDisconnect();
						}}>
						disconnect
					</Button>
				</div>
				<table className='mt-6'>
					<tbody>
						<tr>
							<td className='font-bold'>Serial Number: </td>
							<td>{serialNumberText}</td>
						</tr>
						<tr>
							<td className='font-bold'>latitude: </td>
							<td>{lat}</td>
						</tr>
						<tr>
							<td className='font-bold'>longitude: </td>
							<td>{lng}</td>
						</tr>
						<tr>
							<td className='font-bold'>speed: </td>
							<td>{speed}</td>
						</tr>
						<tr>
							<td className='font-bold'>Status: </td>
							<td>{statusMQTT}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	) : (
		<div>Getting the location data&hellip; </div>
	);
}

export default App;
