import React, { Component } from 'react';
import Streamtopia from '../abis/Streamtopia.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

// App
class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  // Loading the blockchain data:
  async loadBlockchainData() {

    const web3 = window.web3

    // Load the account:
    const accounts = await web3.eth.getAccounts()
    // Zero based index array, get first item out. 
    this.setState({ account: accounts[0]})
      
    // Network data
    const networkId = await web3.eth.net.getId()
    const networkData = Streamtopia.networks[networkId]
    if(networkData) {
      const streamtopia = new web3.eth.Contract(Streamtopia.abi, networkData.address)
      this.setState({ streamtopia })
    
    // Fetch videos
    const videosCount = await streamtopia.methods.videoCount().call()
    this.setState({ videosCount })

    // Load videos, sort by the newest using a for loop.
    for (var i=videosCount; i>=1; i--) {
      const video = await streamtopia.methods.videos(i).call()
      this.setState({
        videos: [...this.state.videos, video]
      })
    }

    // Set the latest video with the title to view as default. 
    const latest = await streamtopia.methods.videos(videosCount).call()
    this.setState({
      currentHash: latest.hash,
      currentTitle: latest.title
    })
    this.setState({ loading: false})
    } else {
      window.alert('Contract not deployed.')
    }

    
  }


  // Prepare file to upload for IPFS. 
  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  // Upload video file to IPFS.
  uploadVideo = title => {
    console.log("Submitting file to IPFS...")

    // Add file.
    // state.buffer since file is already on buffer.
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
      if(error) {
        console.error(error)
        return
      }
      
      // Put it on the blockchain.
      this.setState({ loading: true })
      this.state.streamtopia.methods.uploadVideo(result[0].hash, title).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }


  changeVideo = (hash, title) => {
    this.setState({'currentHash': hash});
    this.setState({'currentTitle': title});
  }

  constructor(props) {
    super(props)
    this.state = {
      buffer: null,
      account: '',
      streamtopia: null,
      videos: [],
      loading: true,
      currentHash: null,
      currentTitle: null
    }

    this.uploadVideo = this.uploadVideo.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.changeVideo = this.changeVideo.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar 
          account={this.state.account}
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              videos={this.state.videos}
              uploadVideo={this.uploadVideo}
              captureFile={this.captureFile}
              changeVideo={this.changeVideo}
              currentHash={this.state.currentHash}
              currentTitle={this.state.currentTitle}
            />
        }
      </div>
    );
  }
}

export default App;