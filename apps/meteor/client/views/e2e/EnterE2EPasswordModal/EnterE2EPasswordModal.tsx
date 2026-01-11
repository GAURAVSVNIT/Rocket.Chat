import { Box, PasswordInput, Field, FieldGroup, FieldRow, FieldError, FieldLink, Button, TextAreaInput, Margins } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { e2e } from '../../../../lib/e2ee/rocketchat.e2e';
import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

type EnterE2EPasswordModalProps = {
	onConfirm: (password: string) => void;
	onClose: () => void;
	onCancel: () => void;
};

const EnterE2EPasswordModal = ({ onConfirm, onClose, onCancel }: EnterE2EPasswordModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [confirmResetPassword, setConfirmResetPassword] = useState(false);
	const resetE2EPassword = useResetE2EPasswordMutation({ options: { onSettled: () => onClose() } });

	const [importMode, setImportMode] = useState(false);
	const [scanning, setScanning] = useState(false);
	const [importedKey, setImportedKey] = useState('');
	const scannerId = useId();

	const {
		handleSubmit,
		control,
		setFocus,
		formState: { errors },
	} = useForm({
		defaultValues: {
			password: '',
		},
	});

	const passwordInputId = useId();

	useEffect(() => {
		if (!importMode) {
			setFocus('password');
		}
	}, [setFocus, importMode]);

	useEffect(() => {
		let scanner: Html5QrcodeScanner | null = null;
		if (scanning) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				const element = document.getElementById(scannerId);
				if (element) {
					scanner = new Html5QrcodeScanner(
						scannerId,
						{ fps: 10, qrbox: { width: 250, height: 250 } },
						false,
					);
					scanner.render(
						(decodedText) => {
							setImportedKey(decodedText);
							setScanning(false);
							scanner?.clear();
						},
						(error) => {
							console.warn(error);
						},
					);
				}
			}, 100);
		}

		return () => {
			if (scanner) {
				scanner.clear().catch(console.error);
			}
		};
	}, [scanning, scannerId]);

	const handleImport = async () => {
		try {
			const storedPublicKey = localStorage.getItem('public_key');
			const publicKey = storedPublicKey || e2e.publicKey || '';

			await e2e.loadKeys({
				public_key: publicKey,
				private_key: importedKey,
			});

			e2e.setState('READY');

			dispatchToastMessage({ type: 'success', message: t('Key_imported_successfully') });
			onClose();
		} catch (error) {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Invalid_key') });
		}
	};

	if (confirmResetPassword) {
		return (
			<GenericModal
				variant='warning'
				title={t('Reset_E2EE_password')}
				icon='warning'
				confirmText={t('Reset_E2EE_password')}
				onClose={onClose}
				onCancel={onClose}
				onConfirm={() => resetE2EPassword.mutate()}
			>
				<Box is='p'>{t('Reset_E2EE_password_description')}</Box>
			</GenericModal>
		);
	}

	if (importMode) {
		return (
			<GenericModal
				variant='warning'
				title={t('Import_E2EE_Key')}
				icon='key'
				onClose={onClose}
				onCancel={() => setImportMode(false)}
				confirmText={t('Import_Key')}
				onConfirm={handleImport}
				cancelText={t('Back')}
			>
				<Box display='flex' flexDirection='column' gap='x16'>
					<Box is='p'>{t('Enter_your_key_manually')}</Box>
					<Box display='flex' justifyContent='center'>
						{!scanning ? (
							<Button icon='qrcode' onClick={() => setScanning(true)}>{t('Scan_QR_Code')}</Button>
						) : (
							<Button icon='circle-cross' onClick={() => setScanning(false)}>{t('Stop_Scanning')}</Button>
						)}
					</Box>
					{scanning && <Box id={scannerId} w='full' h='x250' />}
					<TextAreaInput
						value={importedKey}
						onChange={(e) => setImportedKey((e.target as HTMLInputElement).value)}
						placeholder='{"kty":"RSA", ...}'
						rows={6}
					/>
				</Box>
			</GenericModal>
		);
	}

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(({ password }) => onConfirm(password))} {...props} />}
			variant='warning'
			title={t('Enter_E2E_password')}
			icon='warning'
			cancelText={t('Do_It_Later')}
			confirmText={t('Enable_encryption')}
			onClose={onClose}
			onCancel={onCancel}
		>
			<Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_password_request_text')) }} />
			<FieldGroup mbs={24} w='full'>
				<Field>
					<FieldRow>
						<Controller
							name='password'
							control={control}
							rules={{ required: t('Invalid_pass') }}
							render={({ field, fieldState: { error, invalid } }) => (
								<PasswordInput
									{...field}
									error={error?.message}
									aria-invalid={invalid ? 'true' : 'false'}
									aria-required='true'
									aria-describedby={error ? `${passwordInputId}-error` : undefined}
									placeholder={t('Please_enter_E2EE_password')}
								/>
							)}
						/>
					</FieldRow>
					{errors.password && (
						<FieldError id={`${passwordInputId}-error`} role='alert'>
							{errors.password.message}
						</FieldError>
					)}
					<FieldRow alignSelf='end'>
						<FieldLink
							href='#'
							target={undefined}
							onClick={(e) => {
								e.preventDefault();
								setConfirmResetPassword(true);
							}}
						>
							{t('Forgot_E2EE_Password')}
						</FieldLink>
					</FieldRow>
				</Field>
			</FieldGroup>
			<Box mbs={16} display='flex' justifyContent='center' alignItems='center'>
				<Margins inline='x4'>
					<Box>{t('Or')}</Box>
					<Button onClick={() => setImportMode(true)} small>{t('Import_E2EE_Key')}</Button>
				</Margins>
			</Box>
		</GenericModal>
	);
};

export default EnterE2EPasswordModal;
