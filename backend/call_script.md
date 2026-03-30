# Inbound Carrier Call Script

## Your Role
You are calling as a carrier looking to book freight loads. You have trucks available and want to find loads to haul.

## Sample Conversation Flow

### Opening
**Agent:** "G'day! Thanks for calling our freight brokerage. How are you doing today?"

**You:** "Hi there, I'm doing well, thanks! How about you?"

**Agent:** "Great to hear! I'm doing well, thanks for asking. What can I help you with today?"

**You:** "I'm looking for some loads for my trucks. I've got availability and wanted to see what you have."

### Carrier Information
**Agent:** "Perfect! I'd be happy to help you find some loads. Can I get your MC number and company name?"

**You:** "Sure, my MC number is 249849 and the company is [Company Name]."

**Agent:** "Thanks! Let me verify that in our system. I show [Company Name from verification] - does that sound right?"

**You (if correct):** "Yes, that's correct."

**You (if incorrect):** "Actually, no - the correct company name is [Correct Name]. Can you update that?"

### Load Requirements
**Agent:** "Great! Now, what are you looking for? Where can you pick up from?"

**You:** "I can pick up from Chicago or anywhere in Illinois."

**Agent:** "And where are you willing to deliver to?"

**You:** "I can deliver anywhere in Texas, preferably Dallas or Houston area."

**Agent:** "What type of equipment do you have?"

**You:** "I've got a dry van."

**Agent:** "When are you available for pickup?"

**You:** "I'm available starting tomorrow or the day after."

### Load Presentation & Negotiation
**Agent:** "Let me search for loads that match your criteria... I found a load from Chicago to Dallas, picking up [date], delivering [date]. It's paying $[rate]. Are you interested?"

**You:** "That sounds good, but the rate is a bit low for me. I was hoping for closer to $[higher amount]. Can you work with me on the price?"

**Agent:** "I understand. Let me see what I can do. How about $[counter-offer]?"

**You (if acceptable):** "That works for me! Let's book it."

**You (if still negotiating):** "I appreciate that, but I really need $[amount] to make this work for me."

### Booking Confirmation
**Agent:** "Excellent! I'll get this booked for you at $[final rate]. I'll need to get some paperwork over to you..."

## Tips for Testing Different Scenarios

### Valid Carrier Test (MC 249849)
- Use MC 249849 (this should pass verification)
- Try company names like "Test Logistics" or "Alpha Transport"

### Invalid Carrier Test
- Use a random MC number like 999999 (should fail verification)
- See how the agent handles rejection

### Negotiation Scenarios
- Start with a rate that's 15-20% higher than offered
- Be willing to come down but not below the 85% floor
- Test the 3-round maximum negotiation limit

### Interruption Testing
- Try interrupting when the agent confirms your company name
- Test correcting information mid-conversation
- See if the agent waits for your responses properly

## Common Responses You Might Use

**For rates:** "That's a bit low for me, can you do better?"

**For equipment:** "I've got a 53-foot dry van" or "I run reefer equipment"

**For timing:** "I'm available starting [day]" or "I need to deliver by [date]"

**For locations:** "I can pick up anywhere in [state]" or "I deliver to the Southeast"

**For corrections:** "Actually, that's not right - the correct [information] is..."