import React from "react";
import moment from "moment";
import HelperUtil from "../../util/HelperUtil";
import Results from "./results";

let headers = [
  { label: "TimeStamp", key: "timestamp" },
  { label: "Index", key: "index" },
  { label: "ch_0", key: "ch_0" },
  { label: "ch_1", key: "ch_1" },
  { label: "ch_2", key: "ch_2" },
  { label: "ch_3", key: "ch_3" },
  { label: "participant_id", key: "participant_id" },
];

let headersWithAux = [
  { label: "TimeStamp", key: "timestamp" },
  { label: "Index", key: "index" },
  { label: "ch_0", key: "ch_0" },
  { label: "ch_1", key: "ch_1" },
  { label: "ch_2", key: "ch_2" },
  { label: "ch_3", key: "ch_3" },
  { label: "ch_4", key: "ch_4" },
  { label: "participant_id", key: "participant_id" },
];

class EegMarkers extends React.Component {
  constructor(props) {
    super();

    this.state = {
      participantId: props.participantId,
      isAuxConnected: props.isAuxConnected,
      experimentCompleted: false,
      dataProcessed: false,
      canCloseTab: true,
    };
    this.client = props.museClient;
    this.readings = [];
    this.processedData = [];
  }

  componentDidMount() {
    this.startEegMarkers();
    this.setState({ canCloseTab: false });
    window.addEventListener("beforeunload", this.unLoadEvent);
  }

  componentWillUnmount() {
    if (!this.state.canCloseTab) {
      window.removeEventListener("beforeunload", this.unLoadEvent);
    }
  }

  render() {
    if (!this.state.experimentCompleted) {
      return (
        <div className="App">
          <button
            style={{
              width: "99%",
              height: 25,
              borderRadius: 5,
            }}
            onClick={() => {
              this.stopExpirement();
            }}
          >
            PLEASE CLICK THIS BUTTON TO "END" THE EXPERIMENT.
          </button>

          <iframe
            title="experiment-frame"
            style={{
              width: "99%",
              height: "96vh",
            }}
            src="https://bengodde.github.io/MuseEEGKeys/"
          />
        </div>
      );
    }

    if (!this.state.dataProcessed) {
      return (
        <div className="App">
          <p>Your data is being processed</p>
        </div>
      );
    }

    return (
      <div className="App">
        <Results
          processedDataHeaders={
            this.state.isAuxConnected ? headersWithAux : headers
          }
          processedData={this.processedData}
          processedFileName={
            this.state.participantId +
            "_eegmarkers_eeg_" +
            moment(new Date()).format("YYYYMMDDHHmmss") +
            ".csv"
          }
        ></Results>
      </div>
    );
  }

  startEegMarkers = async () => {
    await this.client.start();
    this.client.eegReadings.subscribe((reading) => {
      this.readings.push(reading);
    });
  };

  stopExpirement = () => {
    this.setState({ experimentCompleted: true });
    this.client.disconnect();

    this.processedData = HelperUtil.cleanData(
      this.readings,
      "eegmarkers",
      this.state.participantId
    );
    this.setState({ dataProcessed: true });

    let jsonBody = {};
    jsonBody.participantId = this.state.participantId;
    jsonBody.experiment = "eegmarkers";
    jsonBody.isAuxConnected = this.state.isAuxConnected;
    jsonBody.eegResult = this.processedData;
    jsonBody = JSON.stringify(jsonBody);

    const postData = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonBody,
    };

    fetch("https://museapp-backend-test1.azurewebsites.net/saveData", postData)
      .then((response) => {
        console.log("Data sent to server");

        window.removeEventListener("beforeunload", this.unLoadEvent);
        this.setState({ canCloseTab: true });
      })
      .catch((error) => {
        console.log("Failure while sending data to server :(");

        window.removeEventListener("beforeunload", this.unLoadEvent);
        this.setState({ canCloseTab: true });
      });
  };

  unLoadEvent = (e) => {
    e.preventDefault();
    e.returnValue = "";
  };
}

export default EegMarkers;
