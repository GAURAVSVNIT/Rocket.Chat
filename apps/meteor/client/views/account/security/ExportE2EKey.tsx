import { Box, Button, Modal, ButtonGroup, Callout, TextAreaInput } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import yaqrcode from 'yaqrcode';

import { e2e } from '../../../lib/e2ee/rocketchat.e2e';

const ExportE2EKey = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isOpen, toggleOpen] = useToggle(false);
	const [showKey, toggleShowKey] = useToggle(false);
	const [keyData, setKeyData] = useState<string | null>(null);

	const handleOpen = () => {
		const keys = e2e.getKeysFromLocalStorage();
		if (!keys.private_key) {
			dispatchToastMessage({ type: 'error', message: t('No_e2e_key_found') });
			return;
		}
		setKeyData(keys.private_key);
		toggleOpen(true);
	};

	const handleCopy = () => {
		if (keyData) {
			navigator.clipboard.writeText(keyData);
			dispatchToastMessage({ type: 'success', message: t('Copied_to_clipboard') });
		}
	};

	return (
		<Box mbs={24}>
			<Box is='h3' fontScale='h4' mbe={8}>
				{t('Export_E2EE_Key')}
			</Box>
			<Box is='p' color='default' mbe={16}>
				{t('Export_E2EE_Key_description')}
			</Box>
			<Button onClick={handleOpen} icon='upload'>
				{t('Export_E2EE_Key')}
			</Button>

			{isOpen && (
				<Modal>
					<Modal.Header>
						<Modal.Title>{t('Export_E2EE_Key')}</Modal.Title>
						<Modal.Close onClick={() => toggleOpen(false)} />
					</Modal.Header>
					<Modal.Content>
						<Callout type='danger' icon='warning' mbe={16}>
							{t('Export_E2EE_Key_warning')}
						</Callout>
						<Box display='flex' flexDirection='column' alignItems='center'>
							{keyData && (
								<Box mbe={16} p={16} bg='neutral-100' borderRadius='x4'>
									<img src={yaqrcode(keyData, { size: 256 })} alt='E2E Key QR Code' style={{ width: 256, height: 256 }} />
								</Box>
							)}
							<ButtonGroup>
								<Button onClick={handleCopy} icon='copy'>
									{t('Copy_Key')}
								</Button>
								<Button onClick={toggleShowKey}>{showKey ? t('Hide_Key') : t('Show_Key')}</Button>
							</ButtonGroup>
							{showKey && keyData && (
								<Box w='full' mbs={16}>
									<TextAreaInput value={keyData} readOnly rows={6} />
								</Box>
							)}
						</Box>
					</Modal.Content>
					<Modal.Footer>
						<ButtonGroup align='end'>
							<Button onClick={() => toggleOpen(false)}>{t('Close')}</Button>
						</ButtonGroup>
					</Modal.Footer>
				</Modal>
			)}
		</Box>
	);
};

export default ExportE2EKey;
