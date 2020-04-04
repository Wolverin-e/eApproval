import React from 'react';
import logo from './logo.svg';
import './App.css';
import PendingRequest from './components/pendingRequests';


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
  
  componentDidMount() {
    fetch('http://127.0.0.1:8000/api/pendingRequests')
    .then(res => res.json())
    .then( (res) => { res = res.response
                      var a = JSON.parse(res)
                      // a.Val = JSON.parse(a.Val)
                      console.log(a)
                      return a} 
                      )
    .then((a) => {
      this.setState({data:a})
      // console.log(a)
    })
    .catch(console.log)
  }

  render() {
    return <PendingRequest data = {this.state.data}></PendingRequest>
  }
}

export default App;
