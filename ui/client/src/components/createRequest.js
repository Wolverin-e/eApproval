import React from 'react'
import fetch from 'isomorphic-fetch'


class createRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
        from_user: '',
        title: '',
        descriptions: '',
        requestedDepartments: ""
      }
    this.onChange = this.onChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async onChange(e) {
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
      console.log(this.state.requestedDepartments)
    }
  }

  handleSubmit() {
    fetch('http://127.0.0.1:8000/api/createRequest', {
        method: 'POST',
        body: JSON.stringify(this.state),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status >= 200 && response.status < 300) {
            console.log(response);
            return response;
            // window.location.reload();
          } else {
            console.log('Somthing happened wrong');
          }
    }).catch(err => err);
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
          <label htmlFor="descriptions">Departments::</label><br/>
          <input type="checkbox" id="ORG1" name="ORG1" value="ORG1" onChange={this.onChange} />
          <label htmlFor="ORG1"> ORG1</label><br/>
          <input type="checkbox" id="ORG2" name="ORG2" value="ORG2" onChange={this.onChange}/>
          <label htmlFor="ORG2"> ORG2</label><br/><br/>
          <input type="submit" onClick={this.handleSubmit}/>
        </form>
        </div>

    )
  }
}


export default createRequest


