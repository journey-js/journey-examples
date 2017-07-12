let utils = {

	isAborted( jqXHR ) {

		if ( jqXHR.status === 0 && jqXHR.statusText === 'abort' ) {
			return true;
		}
		return false;
	},

	isOffline( jqXHR ) {
		if ( jqXHR.status === 0 ) {
			if ( jqXHR.statusText === 'abort' ) {
				return false;
			}
			return true;
		}

		return false;
	}
}

export default utils;