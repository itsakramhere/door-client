import React, {useEffect, useState} from "react";
import * as signalR from "@microsoft/signalr";


const API_Base = "https://localhost:7230";


export default function App() {
  const [doors, setDoors] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_Base}/api/Doors`)
      .then((response) => response.json())
      .then((data) => 
        { 
          setDoors(data.doors ?? []);
          setHistory(data.history ?? []);
        })
      .catch((error) => console.error("Error fetching doors:", error));
  }, []);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_Base}/doorHub`)
      .withAutomaticReconnect()
      .build();

    conn.start()
      .then(() => console.log("SignalR Connected"))
      .catch((error) => console.error("SignalR Connection Error:", error));

      conn.on("DoorUpdated", updated =>{
        setDoors(prevDoors => 
          prevDoors.map(door => door.id === updated.id ? updated : door)
        );
      });
    conn.on("HistoryAdded", ev => {
      setHistory(prevHistory => [ev,...prevHistory]);
    });

    return () => {
      conn.stop()
        .then(() => console.log("SignalR Disconnected"))
        .catch((error) => console.error("SignalR Disconnection Error:", error));
    };
  }, []);
const toggle = async (Id) => {
  try{
    await fetch (`${API_Base}/api/doors/${Id}/toggle`, {method:"POST"});
  }catch{
    console.log("Toggle Failed");
  }
};
  return (
    <div>
      <h1>Building Access Control  Dashboard</h1>
      <div>
        <div>
          <h2>Door Control Pannel</h2>
          <table>
            <thead>
              <tr>
                <th>Door Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doors.map((door) => (
                <tr key={door.id}>
                  <td>{door.name}</td>
                  <td>{door.status === 0 ? "Unlocked" : "Locked"}</td>
                  <td>
                    <button onClick={() => toggle(door.id)}>Toggle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
      <h2>Live Event feed</h2>
      <ul>
        {history.map((entry) => (
          <li key={entry.doorId}>Door {entry.doorId} : {entry.timeStamp}: {entry.newStatus === 0 ? "Unlocked" : "Locked"}</li>
        ))}
      </ul>
    </div>
    </div>    
  );
}
