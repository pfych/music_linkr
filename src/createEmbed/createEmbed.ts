import { EmbedFieldData, MessageActionRow, MessageButton, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { LoggerLayers, platformData } from "../config";
import { SongLinkData, SongLinkDataLinks } from "../getSongLink/getSongLink";
import { createLayeredLogger } from "../utils/logger";

const logger = createLayeredLogger(LoggerLayers.embedGenerator);

const generateEmbedFields = (data: SongLinkData): EmbedFieldData[] => {
	const fields = [];

	try {
		if (data.metaData.genres) {
			fields.push({
				name: "Genres",
				value: data.metaData.genres.length ? data.metaData.genres.join(", ") : "Unknown?"
			});
		}

		if (data.metaData.releaseYear) {
			fields.push({
				name: "Release Date",
				value: data.metaData.releaseYear || "Unknown?"
			});
		}
	} catch (e) {
		logger.error("Unable to generate embed fields", e);
	}

	return fields;
};

const createEmbed = (data: SongLinkData): MessageEmbed => {
	logger.info(`Creating embed for ${data.metaData.title}`);

	try {
		return new MessageEmbed({
			title: data.metaData.title || "Unknown?",
			description: data.metaData.artistName || "Unknown?",
			thumbnail: {
				url: data.metaData.artwork
			},
			fields: generateEmbedFields(data)
		});
	} catch (e) {
		logger.error("Unable to create embed", e);
	}
};

type IterableSongLinkDataLinks = Record<string, SongLinkDataLinks>

const createPlatformButton = (links: IterableSongLinkDataLinks, item: string) => {
	logger.verbose(`Creating button for ${platformData[item].prettyName}`);

	try {
		return new MessageButton({
			label: platformData[item].prettyName,
			disabled: false,
			url: links[item].url,
			style: "LINK",
		}).setEmoji(platformData[item].emoji);
	} catch (e) {
		logger.error("Unabe to create platform button", e);
	}
};

const createComponents = (data: SongLinkData): MessageActionRow[] => {
	logger.info(`Creating components for ${data.metaData.title}`);

	try {
		const itemsPerRow = 2;
		const links: IterableSongLinkDataLinks = data.links;
		const objectKeys = Object.keys(data.links).filter(key => platformData[key]);
		const rowCount = Math.ceil(objectKeys.length / itemsPerRow);

		const allRows = [];

		for (let row = 0; row < rowCount; row++) {
			const buttonRow = new MessageActionRow();

			const offset = itemsPerRow * row;
			const itemsInRow = objectKeys.slice(offset, offset + itemsPerRow);

			buttonRow.addComponents(
				itemsInRow.map(item => {
					return createPlatformButton(links, item);
				}));

			allRows.push(buttonRow);
		}

		// Append the "View more" button
		const lastRow = allRows.length - 1;
		if (allRows[lastRow].components.length < itemsPerRow) {
			allRows[lastRow].components.push(
				new MessageButton({
					label: "View more",
					disabled: false,
					url: data.moreUrl,
					style: "LINK"
				}));
		} else {
			allRows.push(new MessageActionRow({
				components: [
					new MessageButton({
						label: "View more",
						disabled: false,
						url: data.moreUrl,
						style: "LINK"
					})
				]
			}));
		}

		return allRows;
	} catch (e) {
		logger.error("Unable to generate components", e);
	}
}
;

export const createLinkReply = (data: SongLinkData): ReplyMessageOptions  => {
	logger.info(`Creating message for ${data.metaData.title}`);

	try {
		const embed = createEmbed(data);
		const components = createComponents(data);
		return {
			content: " ",
			embeds: [embed],
			components: components
		};
	} catch (e) {
		logger.error("Unable to create reply:", e);
	}
};
