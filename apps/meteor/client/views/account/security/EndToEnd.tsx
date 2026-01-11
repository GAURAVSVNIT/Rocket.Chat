import { Box, Divider } from '@rocket.chat/fuselage';

import { ChangePassphrase } from './ChangePassphrase';
import ExportE2EKey from './ExportE2EKey';
import { ResetPassphrase } from './ResetPassphrase';

const EndToEnd = (): JSX.Element => {
	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start'>
			<ChangePassphrase />
			<Divider mb={36} width='full' />
			<ExportE2EKey />
			<Divider mb={36} width='full' />
			<ResetPassphrase />
		</Box>
	);
};

export default EndToEnd;
