module.exports.properties = {
    name: 'echo',
    aliases: ['e'],
    description: 'Repeats your text.',
    usage: 'synus echo [text]',
}

module.exports.execute = (args, message, bot) => {
    if (Array.isArray(args)) message.channel.send(args.join(' '));
	else message.channel.send(args);
}