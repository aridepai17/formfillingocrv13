const validateExtractedLabels = (labels: string[], scores: Map<string, number>): { validLabels: string[], validatedScores: Map<string, number> } => {
		const validLabels: string[] = [];
		const validatedScores = new Map<string, number>();
		
		// Common invalid patterns to filter out
		const invalidPatterns = [
			/^\d+$/, // Pure numbers
			/^[^\w\s]+$/, // Only special characters
			/^\s+$/, // Only whitespace
			/^[.,;:]+$/, // Only punctuation
			/^[a-z]$/, // Single lowercase letter
			/^[A-Z]$/, // Single uppercase letter
			/^(page|page\s+\d+|pg\s+\d+|p\s+\d+)$/i, // Page numbers
			/^(of|and|or|the|a|an|in|on|at|to|for|with|by)$/i, // Common words
			/^(mr|mrs|ms|dr|prof|sr|jr)$/i, // Titles without names
		];
		
		// Common form field keywords
		const formFieldKeywords = [
			'name', 'email', 'phone', 'address', 'date', 'signature', 'id', 'number', 'age', 'gender', 
			'male', 'female', 'blood', 'type', 'branch', 'course', 'semester', 'room', 'warden', 'diet', 
			'vegetarian', 'faculty', 'manager', 'office', 'reason', 'stay', 'required', 'application', 
			'hostel', 'student', 'year', 'photo', 'from', 'to', 'period', 'duration', 'registration', 
			'roll', 'enrollment', 'department', 'class', 'section', 'marks', 'grade', 'fee', 'payment', 
			'amount', 'remarks', 'approved', 'verified', 'checked', 'issued', 'designation', 'stamp', 
			'seal', 'authorized', 'certified', 'submitted', 'received', 'processed', 'status', 'notes', 
			'comments', 'additional', 'special', 'preference', 'choice', 'option', 'category', 'quota', 
			'merit', 'rank', 'score', 'percentage', 'division', 'result', 'pass', 'fail', 'attendance', 
			'conduct', 'behavior', 'discipline', 'uniform', 'shoes', 'tie', 'badge', 'card', 'proof', 
			'document', 'certificate', 'diploma', 'degree', 'license', 'permit', 'visa', 'passport', 
			'insurance', 'bank', 'account', 'transfer', 'deposit', 'withdrawal', 'balance', 'statement', 
			'receipt', 'invoice', 'bill', 'order', 'delivery', 'tracking', 'shipment', 'customs', 'duty', 
			'tax', 'discount', 'rebate', 'refund', 'claim', 'complaint', 'feedback', 'review', 'rating', 
			'suggestion', 'recommendation', 'approval', 'rejection', 'pending', 'cancelled', 'completed', 
			'processed', 'verified', 'rejected', 'archived', 'deleted', 'restored', 'updated', 'modified', 
			'created', 'edited', 'reviewed', 'signed', 'sealed', 'stamped', 'notarized', 'witnessed', 
			'attested', 'endorsed', 'countersigned', 'initialed', 'dated', 'logged', 'recorded', 
			'documented', 'filed', 'stored', 'saved', 'printed', 'copied', 'scanned', 'uploaded', 
			'downloaded', 'emailed', 'courier', 'registered', 'posted', 'shipped', 'delivered', 
			'accepted', 'processing', 'refunded', 'exchanged', 'returned', 'replaced', 'repaired', 
			'serviced', 'maintained', 'inspected', 'tested', 'calibrated', 'adjusted', 'configured', 
			'installed', 'setup', 'connected', 'disconnected', 'enabled', 'disabled', 'activated', 
			'deactivated', 'started', 'stopped', 'paused', 'resumed', 'restarted', 'reset', 'cleared', 
			'removed', 'added', 'inserted', 'changed', 'revised', 'corrected', 'improved', 'enhanced', 
			'optimized', 'upgraded', 'migrated', 'imported', 'exported', 'backed', 'restored', 'recovered', 
			'archived', 'compressed', 'encrypted', 'decrypted', 'verified', 'authenticated', 'declined', 
			'confirmed', 'postponed', 'delayed', 'expedited', 'rushed', 'urgent', 'normal', 'standard', 
			'regular', 'special', 'custom', 'personal', 'business', 'commercial', 'industrial', 
			'residential', 'government', 'public', 'private', 'non-profit', 'profit', 'educational', 
			'medical', 'legal', 'financial', 'technical', 'administrative', 'operational', 'maintenance', 
			'support', 'service', 'sales', 'marketing', 'research', 'development', 'production', 
			'manufacturing', 'quality', 'control', 'assurance', 'testing', 'inspection', 'audit', 'review', 
			'analysis', 'design', 'planning', 'implementation', 'execution', 'monitoring', 'evaluation', 
			'reporting', 'documentation', 'training', 'education', 'learning', 'teaching', 'instruction', 
			'guidance', 'supervision', 'management', 'leadership', 'direction', 'coordination', 
			'communication', 'collaboration', 'cooperation', 'partnership', 'alliance', 'joint', 'venture', 
			'project', 'program', 'initiative', 'campaign', 'activity', 'event', 'occasion', 'ceremony', 
			'celebration', 'conference', 'meeting', 'workshop', 'seminar', 'training', 'course', 'class', 
			'lesson', 'session', 'period', 'term', 'semester', 'year', 'quarter', 'month', 'week', 'day', 
			'hour', 'minute', 'second', 'time', 'date', 'schedule', 'calendar', 'agenda', 'minutes', 
			'notes', 'records', 'files', 'documents', 'papers', 'reports', 'statements', 'forms', 
			'applications', 'requests', 'proposals', 'contracts', 'agreements', 'policies', 'procedures', 
			'rules', 'regulations', 'guidelines', 'standards', 'specifications', 'requirements', 'criteria', 
			'conditions', 'terms', 'clauses', 'sections', 'chapters', 'pages', 'lines', 'items', 
			'entries', 'data', 'information', 'details', 'facts', 'figures', 'statistics', 'numbers', 
			'values', 'amounts', 'quantities', 'measurements', 'dimensions', 'sizes', 'weights', 
			'volumes', 'areas', 'lengths', 'widths', 'heights', 'depths', 'thicknesses', 'diameters', 
			'radii', 'circumferences', 'perimeters', 'distances', 'positions', 'locations', 'coordinates', 
			'addresses', 'places', 'areas', 'regions', 'zones', 'districts', 'states', 'countries', 
			'continents'
		];
		
		for (const label of labels) {
			const trimmedLabel = label.trim();
			
			// Skip if label is too short or too long
			if (trimmedLabel.length < 2 || trimmedLabel.length > 100) continue;
			
			// Skip if label matches invalid patterns
			if (invalidPatterns.some(pattern => pattern.test(trimmedLabel))) continue;
			
			// Skip if label has too many special characters
			const specialCharRatio = (trimmedLabel.match(/[^a-zA-Z0-9\s\-:().,/&]/g) || []).length / trimmedLabel.length;
			if (specialCharRatio > 0.3) continue;
			
			// Check if it's a valid form field label
			const isValidLabel = 
				// Has reasonable characteristics
				(/[A-Z]/.test(trimmedLabel) && /[a-z]/.test(trimmedLabel) && trimmedLabel.length >= 3 && trimmedLabel.length <= 80) ||
				// Matches common form field patterns
				/^[A-Z][a-zA-Z\s]{2,}[:\*]?\s*$/.test(trimmedLabel) ||
				/^.+[:\*]\s*$/.test(trimmedLabel) ||
				/^\d+\.\s*[A-Z]/.test(trimmedLabel) ||
				// Contains common form field keywords
				formFieldKeywords.some(keyword => 
					trimmedLabel.toLowerCase().includes(keyword) && 
					trimmedLabel.length >= 3
				);
			
			if (isValidLabel) {
				validLabels.push(trimmedLabel);
				const score = scores.get(label) || 50;
				
				// Boost confidence for validated labels
				const validatedScore = Math.min(100, score + 10);
				validatedScores.set(trimmedLabel, validatedScore);
			}
		}
		
		return { validLabels, validatedScores };
	};
