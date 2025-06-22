// Load environment variables
require('dotenv').config();

// Required libraries
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Supabase Edge Function URL
const SUPABASE_FUNCTION_URL = 'https://oemkxjxyhqvjkxbynpnq.supabase.co/functions/v1/discord-bot';

// Generic function to call Supabase
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

// When the bot is ready
client.once('ready', () => {
    console.log(`✅ POLOGANG Discord Bot is ONLINE as ${client.user.tag}`);
    console.log(`📊 Connected to ${client.guilds.cache.size} guild(s)`);

    // Set bot status
    client.user.setPresence({
        activities: [{ name: 'POLOGANG Server', type: 'WATCHING' }],
        status: 'online',
    });

    // CRON JOBS
    setupDailyRadioPost();
    // You can add more cron jobs here later e.g.:
    // setupAnotherScheduledPost();
});

// DAILY RADIO POST (Runs at 10:00 every day)
function setupDailyRadioPost() {
    cron.schedule('0 10 * * *', async () => {
        try {
            const channelId = '1045148396350078986';
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
                console.error('Channel not found!');
                return;
            }

            const radio = Math.floor(1000 + Math.random() * 9000);
            const emergencyRadio = Math.floor(1000 + Math.random() * 9000);

            const medlemRoleId = '674647666764021781';

            const messageContent = `
<@&${medlemRoleId}>

📻 **Radio:** ${radio}  
🚨 **Nød:** ${emergencyRadio}
`;

            await channel.send(messageContent);
            console.log('✅ Daily radio message sent!');
        } catch (error) {
            console.error('Error sending daily message:', error);
        }
    });

    console.log('📅 Daily radio post scheduled at 12:00!');
}

// EVENTS

// New member joins
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.username} (${member.user.id})`);
    // Future: You can add welcome messages here
});

// Member leaves
client.on('guildMemberRemove', async (member) => {
    console.log(`👋 Member left: ${member.user.username} (${member.user.id})`);

    await callSupabaseFunction('member-left', {
        discordId: member.user.id,
        username: member.user.username
    });
});

// Role updates
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(role => role.name);
    const newRoles = newMember.roles.cache.map(role => role.name);

    if (JSON.stringify(oldRoles.sort()) !== JSON.stringify(newRoles.sort())) {
        console.log(`🔄 Role update for ${newMember.user.username}:`);
        console.log(`  Old roles: ${oldRoles.join(', ')}`);
        console.log(`  New roles: ${newRoles.join(', ')}`);

        await callSupabaseFunction('sync-user-roles', {
            discordId: newMember.user.id,
            userId: null,
            forceUpdate: true
        });
    }
});

// Bot errors and warnings
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

// LOGIN BOT
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
});
