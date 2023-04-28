//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "hardhat/console.sol";

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Event {
    address payable public nftickets;
    address public nftAddress;

    mapping(uint256 => address) public eventOrganizer;
    mapping(uint256 => bool) public isEventEnded;
    mapping(uint256 => uint256) public eventRevenue;
    mapping(uint256 => uint256) public eventProfit;
    mapping(uint256 => uint256) public eventTicketQty;
    mapping(uint256 => uint256) public ticketEventID;
    mapping(uint256 => uint256) public ticketPrice;
    mapping(uint256 => uint256) public ticketRarity;
    mapping(uint256 => bool) public isTicketSold;

    constructor(address _nftAddress) {
        nftickets = payable(msg.sender);
        nftAddress = _nftAddress;
    }

    // List event
    function listEvent(
        uint256 _eventID,
        uint256 _eventTicketQty
    ) public {
        eventOrganizer[_eventID] = msg.sender;
        eventTicketQty[_eventID] = _eventTicketQty;
        eventRevenue[_eventID] = 0;
        eventProfit[_eventID] = 0;
        isEventEnded[_eventID] = false;

    }

    // List ticket
    function listTicket(
        uint256 _nftID,
        uint256 _rarityID,
        uint256 _eventID,
        uint256 _ticketPrice
    ) public payable {
        // Transfer NFT from organizer to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        // Set nft ticket details
        ticketPrice[_nftID] = _ticketPrice;   
        ticketRarity[_nftID] = _rarityID;  
        ticketEventID[_nftID] = _eventID;
        isTicketSold[_nftID] = false;
    }

    // Buy ticket
    // -> Check if value is exactly equal to ticketPrice
    // -> Updates isTicketSold status
    // -> Updates eventRevenue amount
    // -> Transfer NFT ticket from contract to attendee
    function buyTicket(uint256 _nftID) public payable  {
        require(msg.value == ticketPrice[_nftID],  'Payment must be exact');
        
        isTicketSold[_nftID] = true;
        eventRevenue[ticketEventID[_nftID]] += ticketPrice[_nftID];
        IERC721(nftAddress).transferFrom(address(this), msg.sender, _nftID);
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}