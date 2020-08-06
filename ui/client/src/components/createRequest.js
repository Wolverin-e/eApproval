import React from 'react'
import fetch from 'isomorphic-fetch'
import { saveAs } from 'file-saver'


class createRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      from_user: '',
      title: '',
      descriptions: '',
      user_proposal: {},
      requestedDepartments: "",
    }
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    
    this.fileInput = React.createRef();
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }

  onChange(e) {
    if (e.target.id === 'from_user') {
      this.setState({ from_user: e.target.value });
    } else if (e.target.id === 'title') {
      this.setState({ title: e.target.value });
    } else if (e.target.id === 'descriptions') {
      this.setState({ descriptions: e.target.value });
    } else {
      let a = this.state.requestedDepartments.split(' ');
      a = a.filter(a => a !== '');
      if(e.target.checked){
        a.push(e.target.name);
        this.setState({
          requestedDepartments: a.join(' ')
        })
      } else {
        this.setState({ 
          requestedDepartments: a.filter(org => org !== e.target.name).join(' ')
        })
      }
    }
  }

  async handleSubmit() {
    let user_proposal = await this.getFileContentInBase64();
    this.setState({user_proposal});
    console.log(this.state, JSON.stringify(this.state))
    fetch('http://127.0.0.1:8000/api/createRequest', {
      method: 'POST',
      body: JSON.stringify(this.state),
      headers: {
          'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.status >= 200 && response.status < 300) {
        window.location.reload();
        return response;
      } else {
        console.log('Somthing happened wrong');
      }
    }).catch(err => err);
  }

  async getFileContentInBase64(){
    if(this.fileInput.current.files.length){
      return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = evt => {
          resolve({
            name: this.fileInput.current.files[0].name,
            data: evt.target.result
          });
        }
        reader.readAsDataURL(this.fileInput.current.files[0]);
      })
    } else {
      return "";
    }
  }

  async handleFileUpload(){
    console.log(this.fileInput.current.files[0]);
    var reader = new FileReader();
    reader.onload = evt => {
      console.log(evt.target.result);
      fetch(evt.target.result).then(async res => {
        saveAs(await res.blob(), this.fileInput.current.files[0].name);
      });
    }
    reader.readAsDataURL(this.fileInput.current.files[0]);
  }

  render() {

    return (
      <div>
        <form>
          <label htmlFor="from_user">Username:</label><br/>
          <input type="text" id="from_user" name="from_user" onChange={this.onChange} /><br/>
          <label htmlFor="title">title:</label><br/>
          <input type="text" id="title" name="title"  onChange={this.onChange} /><br/><br/>
          <label htmlFor="descriptions">description:</label><br/>
          <input type="textfield" id="descriptions" name="descriptions" onChange={this.onChange} /><br/><br/>
          <label htmlFor="proposal">Proposal:</label><br/>
          <input type="file" id="proposal" ref={this.fileInput} /><br/><br/>
          <label htmlFor="descriptions">Departments:</label><br/>
          <input type="checkbox" id="ORG1" name="ORG1" value="ORG1" onChange={this.onChange} />
          <label htmlFor="ORG1"> ORG1</label><br/>
          <input type="checkbox" id="ORG2" name="ORG2" value="ORG2" onChange={this.onChange}/>
          <label htmlFor="ORG2"> ORG2</label><br/><br/>
          <input type="button" value="create" onClick={this.handleSubmit}/>
        </form>
      </div>
    )
  }
}


export default createRequest


