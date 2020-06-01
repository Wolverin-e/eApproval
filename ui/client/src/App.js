import React from 'react';
// import './App.scss';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'
import PendingRequest from './components/pendingRequests';
import ApprovedRequest from './components/approvedRequest';
import DeclinedRequest from './components/declinedRequest';
import CreateRequest from './components/createRequest';

class App extends React.Component {

  state = {
    data: []
  }

  render() {
    return (
    <Router>
      <Switch>
        <div>
          <Route path="/">
            <div className="nav-bar">
              <ul>
                <li><a href="../createRequest">Create Request</a></li>
                <li><a href="../org1">ORG1</a></li>
                <li><a href="../org2">ORG2</a></li>
                <li><a href="../publicBoard">Public Board</a></li>
              </ul>
            </div>
          </Route>
          <Route path ="/createRequest">
            <CreateRequest></CreateRequest>
          </Route>
          <Route path="/publicBoard">
            <ApprovedRequest></ApprovedRequest>
            <DeclinedRequest></DeclinedRequest>
          </Route>
          <Route path="/org1">
            <PendingRequest department = "ORG1"></PendingRequest>
          </Route>
          <Route path="/org2">
            <PendingRequest department = "ORG2"></PendingRequest>
          </Route>
        </div>
      </Switch>
    </Router>
    )
  }
}

export default App;
