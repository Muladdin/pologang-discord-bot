require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Supabase Edge Function URL
const SUPABASE_FUNCTION_URL = 'https://oemkxjxyhqvjkxbynpnq.supabase.co/functions/v1/discord-bot';

// Function to call Supabase Edge Function
async function callSupabaseFunction(action, data) {
    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });

        const result = await response.json();
        console.log(`Supabase function call (${action}):`, result);
        return result;
    } catch (error) {
        console.error(`Error calling Supabase function (${action}):`, error);
        return null;
    }
}

client.once('ready', () => {
    console.log(`✅ POLOGANG Discord Bot is now ONLINE as ${client.user.tag}`);
    console.log(`📊 Connected to ${client.guilds.cache.size} guild(s)`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{ name: 'POLOGANG Server', type: 'WATCHING' }],
        status: 'online',
    });
});

// Handle new members joining
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.username} (${member.user.id})`);
    
    // You can add welcome message logic here if needed
    // For now, we just log it - the actual access control happens in login
});

// Handle members leaving
client.on('guildMemberRemove', async (member) => {
    console.log(`👋 Member left: ${member.user.username} (${member.user.id})`);
    
    // Call Supabase function to handle member leaving
    await callSupabaseFunction('member-left', {
        discordId: member.user.id,
        username: member.user.username
    });
});

// Handle role updates
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(role => role.name);
    const newRoles = newMember.roles.cache.map(role => role.name);
    
    // Check if roles actually changed
    if (JSON.stringify(oldRoles.sort()) !== JSON.stringify(newRoles.sort())) {
        console.log(`🔄 Role update for ${newMember.user.username}:`);
        console.log(`  Old roles: ${oldRoles.join(', ')}`);
        console.log(`  New roles: ${newRoles.join(', ')}`);
        
        // Call Supabase function to sync roles
        await callSupabaseFunction('sync-user-roles', {
            discordId: newMember.user.id,
            userId: null, // Will be looked up in the database
            forceUpdate: true
        });
    }
});

// Handle bot errors
client.on('error', error => {
    console.error('❌ Discord bot error:', error);
});

client.on('warn', warning => {
    console.warn('⚠️ Discord bot warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down Discord bot...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down Discord bot...');
    client.destroy();
    process.exit(0);
});

// Login using bot token
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
});


const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Schedule the daily post at 12:00 (server time)
    cron.schedule('0 12 * * *', async () => {
        try {
            const channelId = '1045148396350078986';
            const channel = await client.channels.fetch(channelId);
            
            if (!channel) {
                console.error('Channel not found!');
                return;
            }

            // Generate 4-digit numbers
            const radio = Math.floor(1000 + Math.random() * 9000);
            const emergencyRadio = Math.floor(1000 + Math.random() * 9000);

            // Replace ROLE_IDs with your actual role IDs
            const medlemRoleId = '674647666764021781';
            const shababRoleId = '1361831885726289940';

            const messageContent = `
<@&${medlemRoleId}> <@&${shababRoleId}>

📻 **Radio:** ${radio}  
🚨 **Nød:** ${emergencyRadio}
`;

            await channel.send(messageContent);

            console.log('✅ Daily radio message sent!');
        } catch (error) {
            console.error('Error sending daily message:', error);
        }
    });
});

client.login(process.env.DISCORD_BOT_TOKEN);
