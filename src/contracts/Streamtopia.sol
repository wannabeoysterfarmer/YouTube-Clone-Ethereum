pragma solidity ^0.5.0;

/**

This is a contract for a decentralized game-streaming service called Streamtopia, which can be
used to stream videos of game play. Eventually, this platform will also allow live streams, and
eventually income streaming. 

 */
contract Streamtopia {

  // Variables
  uint public videoCount = 0;
  string public name = "Streamtopia";

  // ID mapping to video.
  // STORES VIDEO.  
  mapping(uint => Video) public videos;

  // Video struct for modeling the video. 
  struct Video {
    uint id;
    string hash;
    string title;
    address author;
  }

  // Upload video as an event. 
  event VideoUploaded(
    uint id,
    string hash,
    string title,
    address author
  );

  // Empty constructor. 
  constructor() public {
  }

  // Function for an user to upload the video. 
  function uploadVideo(string memory _videoHash, string memory _title) public {
    
    // Make sure video hash, title, and sender address exist.
    require(bytes(_videoHash).length > 0); // video hash exists
    require(bytes(_title).length > 0); // uploader address exists.
    require(msg.sender!=address(0));

    // Video count.
    videoCount = videoCount + 1;

    // Adding videos to the contract. 
    videos[videoCount] = Video(videoCount, _videoHash, _title, msg.sender);

    // Trigger event
    emit VideoUploaded(videoCount, _videoHash, _title, msg.sender);
  }
}
