import { handleAPI } from '../../worker/api.js';

export default request => handleAPI(request, process.env);

export const config = { path: '/api/*' };
