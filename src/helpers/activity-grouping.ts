import nlp from 'compromise';

const ACTIVITY_CATEGORIES = {
  'strength training': ['strength training', 'lift', 'weight', 'gym', 'muscle', 'strength', 'jim'],
  'cardio': ['cardio', 'run', 'jog', 'sprint', 'walk', 'hiking'],
  'flexibility': ['flexibility', 'stretch', 'yoga', 'mobility'],
  'mindfulness': ['mindfulness', 'meditate', 'meditation', 'breathwork'],
  'sports': ['sports', 'tennis', 'golf', 'basketball', 'soccer', 'volleyball', 'baseball', 'swimming']
};

function calculateSimilarity(activity: string, keywords: string[]): number {
  const activityParts = activity.toLowerCase().split('/');
  
  // For each keyword, check against all parts of the activity
  const similarities = keywords.map(keyword => {
    const normalizedKeyword = keyword.toLowerCase()
      .replace(/[^a-z]/g, '');
    
    const maxSimilarity = Math.max(...activityParts.map(part => {
      const normalizedPart = part.trim()
        .replace(/(.)\1+/g, '$1')
        .replace(/[^a-z]/g, '');
      
      const maxLength = Math.max(normalizedPart.length, normalizedKeyword.length);
      const distance = levenshteinDistance(normalizedPart, normalizedKeyword);
      const similarity = 1 - (distance / maxLength);
      
      // Debug logging
      if (normalizedPart === 'cardio') {
        console.log(`Comparing '${normalizedPart}' with '${normalizedKeyword}': ${similarity}`);
      }
      
      return similarity;
    }));

    return maxSimilarity;
  });

  return Math.max(...similarities);
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

export function groupSimilarActivities(activities: Array<{activityName: string, [key: string]: any}>) {
  const groups: Map<string, Array<typeof activities[0]>> = new Map();

  activities.forEach(activity => {
    const normalizedName = activity.activityName.toLowerCase().trim();
    
    let bestMatch = {
      category: Object.keys(ACTIVITY_CATEGORIES)[0], // Default to first category
      similarity: 0
    };

    for (const [category, keywords] of Object.entries(ACTIVITY_CATEGORIES)) {
      const similarity = calculateSimilarity(normalizedName, keywords);
      if (similarity > bestMatch.similarity) {
        bestMatch = { category, similarity };
      }
    }

    const existingGroup = groups.get(bestMatch.category) || [];
    existingGroup.push(activity);
    groups.set(bestMatch.category, existingGroup);
  });

  return groups;
} 