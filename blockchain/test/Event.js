const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const weiToEth = (n) => {
    return ethers.utils.formatEther(n)
}

const ether = tokens;

describe('NFTicket', () => {
    let ticketContract, eventContract;

    beforeEach(async () => {
        //Setup accounts
        [nftickets, organizer, attendee] = await ethers.getSigners()
        
        // Deploy Ticket contract
        const TicketContract = await ethers.getContractFactory('Ticket', nftickets)
        ticketContract = await TicketContract.deploy()

        // Mint NFT Ticket
        await ticketContract.connect(organizer).mint("https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png")

        // Deploy Event contract
        const EventContract = await ethers.getContractFactory('Event', nftickets)
        eventContract = await EventContract.deploy(ticketContract.address)

        // Approve ticket
        let transaction = await ticketContract.connect(organizer).approve(eventContract.address, 1)
        await transaction.wait()

        // List event 
        transaction =  await eventContract.connect(organizer).listEvent(1, 3)
        await transaction.wait()

        //List event ticket
        transaction = await eventContract.connect(organizer).listTicket(1, 1, 1, ether(0.5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await eventContract.nftAddress()
            expect(result).to.be.equal(ticketContract.address)
        })
        
        it('Returns NFTickets address (Address for Dapp owners)', async () => {
            const result = await eventContract.nftickets()
            expect(result).to.be.equal(nftickets.address)
        })
    })

    describe('Minted NFT Tickets total supply', () => {
        it('Returns total supply', async () => {
            //Check Results
            transaction = await ticketContract.totalSupply()
            expect(Number(await transaction.toString())).to.be.equal(1)
        })
    })

    describe('List event', () => {
        it('Returns eventOrganizer', async () => {
            transaction = await eventContract.eventOrganizer(1)
            expect(await transaction).to.be.equal(organizer.address)
        })
        
        it('Returns eventTicketQuantity', async () => {
            transaction = await eventContract.eventTicketQty(1)
            expect(await transaction).to.be.equal(3)
        })

        it('Updates eventRevenue', async () => {
            transaction = await eventContract.eventRevenue(1)
            expect(await transaction).to.be.equal(0)
        })
        
        it('Updates eventProfit', async () => {
            transaction = await eventContract.eventProfit(1)
            expect(await transaction).to.be.equal(0)
        })

        it('Updates isEventEnded status', async () => {
            transaction = await eventContract.isEventEnded(1)
            expect(await transaction).to.be.equal(false)
        })
    })

    describe('List event tickets', () => {
        it('Updates ticket ownership', async () => {
            expect(await ticketContract.ownerOf(1)).to.be.equal(eventContract.address)
        })

        it('Returns ticketEventID', async () => {
            transaction = await eventContract.connect(organizer).ticketEventID(1)
            expect(Number(await transaction.toString())).to.be.equal(1)   
        })

        it('Returns ticketPrice', async () => {
            transaction = await eventContract.connect(organizer).ticketPrice(1)
            expect(Number(weiToEth(await transaction))).to.be.equal(0.5) 
        })

        it('Returns ticketRarity', async () => {
            transaction = await eventContract.connect(organizer).ticketRarity(1)
            expect(await transaction).to.be.equal(1)   
        })
        
        it('Updates isTicketSold status', async () => {
            transaction = await eventContract.connect(organizer).isTicketSold(1)
            expect(await transaction).to.be.equal(false)   
        })
    })
    
    describe('Buy ticket', () => {
        beforeEach(async () => {
            transaction = await eventContract.connect(attendee).buyTicket(1, {value: ether(0.5)})
            await transaction.wait()
        })
        
        it('Updates eventRevenue', async () => {
            transaction = await eventContract.eventRevenue(1)
            expect(Number(weiToEth(await transaction))).to.be.eq(0.5)
        })

        it('Updates contract balance', async () => {
            transaction = await eventContract.getBalance()
            expect(Number(weiToEth(await transaction))).to.be.eq(0.5)
        })

        it('Updates isTicketSold status', async () => {
            transaction = await eventContract.connect(organizer).isTicketSold(1)
            expect(await transaction).to.be.equal(true)   
        })
        
        it('Updates ticket ownership', async () => {
            expect(await ticketContract.ownerOf(1)).to.be.equal(attendee.address)
        })
    })
})