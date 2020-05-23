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
