import React from 'react';
// import './App.scss';
import './App.css';
import PendingRequest from './components/pendingRequests';
import ApprovedRequest from './components/approvedRequest';
import DeclinedRequest from './components/declinedRequest';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

class App extends React.Component {

  state = {
    data: []
  }

  render() {
    return (
    <div>
      <ApprovedRequest></ApprovedRequest>
      <PendingRequest></PendingRequest>
      <DeclinedRequest></DeclinedRequest>
    </div>
    )
  }
}

export default App;
