const express = require('express');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');


const app = express();
const port = 3001;

app.use(cors());
app.use(express.urlencoded({ extended: true })); 


process.env.UV_THREADPOOL_SIZE = 16; // Increase the pool size to 16 threads



// GraphQL query to fetch user stats (problem count by difficulty)
const userStatsQuery = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

// GraphQL query to fetch recent submissions
const recentSubQuery = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      timestamp
      statusDisplay
      runtime
      memory
      lang
    }
  }
`;

async function fetchLeet(username) {
  const graphqlUrl = "https://leetcode.com/graphql";
  
  try {
    // Fetch user statistics (problem count by difficulty)
    const statsResponse = await axios.post(graphqlUrl, {
      query: userStatsQuery,
      variables: { username },
    });

    // Fetch recent submissions
    const recentSubResponse = await axios.post(graphqlUrl, {
      query: recentSubQuery,
      variables: { username, limit: 2 },
    });

    const userStats = statsResponse.data.data.matchedUser.submitStats.acSubmissionNum || [];
    const recentSubmissions = recentSubResponse.data.data.recentAcSubmissionList || [];

    // Process user stats to get counts by difficulty
    const stats = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
    };

    userStats.forEach(item => {
      switch (item.difficulty) {
        case "All":
          stats.totalSolved = item.count;
          break;
        case "Easy":
          stats.easySolved = item.count;
          break;
        case "Medium":
          stats.mediumSolved = item.count;
          break;
        case "Hard":
          stats.hardSolved = item.count;
          break;
        default:
          break;
      }
    });

    return {
      stats,
      recentSubmissions,
    };
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    return {
      stats: {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      },
      recentSubmissions: [],
    };
  }
}

async function fetchAndSaveData() {

  try {
    console.log('Starting to read input files...');
    const rolls = fs.readFileSync('./details_Second/roll.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const names = fs.readFileSync('./details_Second/name.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const urls = fs.readFileSync('./details_Second/urls.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const sections = fs.readFileSync('./details_Second/sections.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const day = fs.readFileSync('./details_Second/day.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const mobnos = fs.readFileSync('./details_Second/mobno.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);

    
    if (
      rolls.length !== names.length || 
      names.length !== urls.length || 
      names.length !== sections.length || 
      names.length !== mobnos.length
    ) {
      console.error('Error: The number of rolls, names, URLs, sections, and phone numbers do not match.');
      return;
    }

    console.log('Input files read successfully.');
    const combinedData = [];

    for (let i = 0; i < rolls.length; i++) {
      const roll = rolls[i];
      const name = names[i];
      const url = urls[i];
      const section = sections[i];
      const dayi = day[i];
      const mobno = mobnos[i];

      let studentData = { roll, name, url, section, dayi, mobno };

      console.log(`Processing data for roll number: ${roll}, name: ${name}, section: ${section}, day: ${dayi}, phone: ${mobno}`);

      
      if (url.startsWith('https://leetcode.com/u/')) {
        var username = url.split('/u/')[1];
        if (username.charAt(username.length - 1) === '/') username = username.substring(0, username.length - 1);
        console.log(`Fetching data for LeetCode username: ${username}`);

        try {
          const { stats, recentSubmissions } = await fetchLeet(username);
          studentData = {
            ...studentData,
            username,
            totalSolved: stats.totalSolved,
            easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved,
            hardSolved: stats.hardSolved,
            recentSubmissions,
          };
          console.log(`Data for ${username} fetched and processed successfully.`);
        } catch (error) {
          console.error(`Error fetching data for ${username}:`, error);
        }
      } else {
        console.log(`URL for ${name} is not a LeetCode profile. Skipping API call.`);
        studentData.info = 'No LeetCode data available';
      }

      combinedData.push(studentData);
    }

    
    combinedData.sort((a, b) => {
      const aTotalSolved = isNaN(a.totalSolved) ? 0 : a.totalSolved;
      const bTotalSolved = isNaN(b.totalSolved) ? 0 : b.totalSolved;
      return bTotalSolved - aTotalSolved;
    });

    
    fs.writeFileSync('data_Second.json', JSON.stringify(combinedData, null, 2));
    console.log('Data saved to data.json successfully.');
  } catch (error) {
    console.error('Error processing data:', error);
  }
  

  try {
    console.log('Starting to read input files...');
    const rolls = fs.readFileSync('./details_September/roll.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const names = fs.readFileSync('./details_September/name.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const urls = fs.readFileSync('./details_September/urls.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const sections = fs.readFileSync('./details_September/sections.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const day = fs.readFileSync('./details_September/day.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const mobnos = fs.readFileSync('./details_September/mobno.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);

    // Validate input lengths
    if (
      rolls.length !== names.length || 
      names.length !== urls.length || 
      names.length !== sections.length || 
      names.length !== mobnos.length
    ) {
      console.error('Error: The number of rolls, names, URLs, sections, and phone numbers do not match.');
      return;
    }

    console.log('Input files read successfully.');
    const combinedData = [];

    for (let i = 0; i < rolls.length; i++) {
      const roll = rolls[i];
      const name = names[i];
      const url = urls[i];
      const section = sections[i];
      const dayi = day[i];
      const mobno = mobnos[i];

      let studentData = { roll, name, url, section, dayi, mobno };

      console.log(`Processing data for roll number: ${roll}, name: ${name}, section: ${section}, day: ${dayi}, phone: ${mobno}`);

      // Fetch LeetCode data if the URL is valid
      if (url.startsWith('https://leetcode.com/u/')) {
        var username = url.split('/u/')[1];
        if (username.charAt(username.length - 1) === '/') username = username.substring(0, username.length - 1);
        console.log(`Fetching data for LeetCode username: ${username}`);

        try {
          const { stats, recentSubmissions } = await fetchLeet(username);
          studentData = {
            ...studentData,
            username,
            totalSolved: stats.totalSolved,
            easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved,
            hardSolved: stats.hardSolved,
            recentSubmissions,
          };
          console.log(`Data for ${username} fetched and processed successfully.`);
        } catch (error) {
          console.error(`Error fetching data for ${username}:`, error);
        }
      } else {
        console.log(`URL for ${name} is not a LeetCode profile. Skipping API call.`);
        studentData.info = 'No LeetCode data available';
      }

      combinedData.push(studentData);
    }

    
    combinedData.sort((a, b) => {
      const aTotalSolved = isNaN(a.totalSolved) ? 0 : a.totalSolved;
      const bTotalSolved = isNaN(b.totalSolved) ? 0 : b.totalSolved;
      return bTotalSolved - aTotalSolved;
    });

    
    fs.writeFileSync('data_September.json', JSON.stringify(combinedData, null, 2));
    console.log('Data saved to data.json successfully.');
  } catch (error) {
    console.error('Error processing data:', error);
  }

  try {
    console.log('Starting to read input files...');
    const rolls = fs.readFileSync('./details_January/roll.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const names = fs.readFileSync('./details_January/name.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const urls = fs.readFileSync('./details_January/urls.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const sections = fs.readFileSync('./details_January/sections.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const day = fs.readFileSync('./details_January/day.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const mobnos = fs.readFileSync('./details_January/mobno.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);

    
    if (
      rolls.length !== names.length || 
      names.length !== urls.length || 
      names.length !== sections.length || 
      names.length !== mobnos.length
    ) {
      console.error('Error: The number of rolls, names, URLs, sections, and phone numbers do not match.');
      return;
    }

    console.log('Input files read successfully.');
    const combinedData = [];

    for (let i = 0; i < rolls.length; i++) {
      const roll = rolls[i];
      const name = names[i];
      const url = urls[i];
      const section = sections[i];
      const dayi = day[i];
      const mobno = mobnos[i];

      let studentData = { roll, name, url, section, dayi, mobno };

      console.log(`Processing data for roll number: ${roll}, name: ${name}, section: ${section}, day: ${dayi}, phone: ${mobno}`);

      
      if (url.startsWith('https://leetcode.com/u/')) {
        var username = url.split('/u/')[1];
        if (username.charAt(username.length - 1) === '/') username = username.substring(0, username.length - 1);
        console.log(`Fetching data for LeetCode username: ${username}`);

        try {
          const { stats, recentSubmissions } = await fetchLeet(username);
          studentData = {
            ...studentData,
            username,
            totalSolved: stats.totalSolved,
            easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved,
            hardSolved: stats.hardSolved,
            recentSubmissions,
          };
          console.log(`Data for ${username} fetched and processed successfully.`);
        } catch (error) {
          console.error(`Error fetching data for ${username}:`, error);
        }
      } else {
        console.log(`URL for ${name} is not a LeetCode profile. Skipping API call.`);
        studentData.info = 'No LeetCode data available';
      }

      combinedData.push(studentData);
    }

    
    combinedData.sort((a, b) => {
      const aTotalSolved = isNaN(a.totalSolved) ? 0 : a.totalSolved;
      const bTotalSolved = isNaN(b.totalSolved) ? 0 : b.totalSolved;
      return bTotalSolved - aTotalSolved;
    });

    
    fs.writeFileSync('data_January.json', JSON.stringify(combinedData, null, 2));
    console.log('Data saved to data.json successfully.');
  } catch (error) {
    console.error('Error processing data:', error);
  }
  
}


app.get('/dataSep', (req, res) => {
  res.sendFile(__dirname + '/data_September.json');
});
app.get('/dataJan', (req, res) => {
  res.sendFile(__dirname + '/data_January.json');
});
app.get('/dataSecond', (req, res) => {
  res.sendFile(__dirname + '/data_Second.json');
});
app.get('/dataChange', (req, res) => {
  res.sendFile(__dirname + '/admin.html'); 
});

app.post('/dataChange', async (req, res) => {
  const rollNumber = req.body.rollNumber;
  const leetcodeUrl = req.body.leetcodeUrl;
  const password = req.body.password;
  // console.log(password);
  if(password !== "rajdeep"){ res.send("Wrong password and IP address captured for detection"); }
  else{
  console.log('Roll Number:', rollNumber);
  console.log('LeetCode URL:', leetcodeUrl);

  
  const name = await updateUrlInVm(rollNumber, leetcodeUrl);
  if(name){
    res.send(`URL changed for ${name.name} with new Problems solved = ${name.cur}`);
  }
  else 
    res.send("Wrong Roll");
  }
  });

  async function updateUrlInVm(roll, newUrl) {
    const datasets = ["September", "January", "Second"];
    let found = false;
    let filePath, rolls, names, urls, sections, day, mobnos;
  
    for (const dataset of datasets) {
      filePath = `./data_${dataset}.json`;
  
      try {
        rolls = fs.readFileSync(`./details_${dataset}/roll.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
        names = fs.readFileSync(`./details_${dataset}/name.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
        urls = fs.readFileSync(`./details_${dataset}/urls.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
        sections = fs.readFileSync(`./details_${dataset}/sections.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
        day = fs.readFileSync(`./details_${dataset}/day.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
        mobnos = fs.readFileSync(`./details_${dataset}/mobno.txt`, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
      } catch (err) {
        console.error(`Error reading files for ${dataset}:`, err);
        continue;
      }
  
      let rollIndex = rolls.indexOf(roll.toString());
      if (rollIndex === -1) continue;
  
      found = true;
      urls[rollIndex] = newUrl;
      fs.writeFileSync(`./details_${dataset}/urls.txt`, urls.join('\n'));
  
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const combinedData = data.filter((entry) => entry.roll !== roll);
  
        const name = names[rollIndex];
        const url = urls[rollIndex];
        const section = sections[rollIndex];
        const dayi = day[rollIndex];
        const mobno = mobnos[rollIndex];
  
        let studentData = { roll, name, url, section, dayi, mobno };
        let cur = -1;
  
        if (url.startsWith('https://leetcode.com/u/')) {
          let username = url.split('/u/')[1];
          if (username.charAt(username.length - 1) === '/') username = username.substring(0, username.length - 1);
          console.log(`Fetching data for LeetCode username: ${username}`);
  
          try {
            const { stats, recentSubmissions } = await fetchLeet(username);
            studentData = {
              ...studentData,
              username,
              totalSolved: stats.totalSolved,
              easySolved: stats.easySolved,
              mediumSolved: stats.mediumSolved,
              hardSolved: stats.hardSolved,
              recentSubmissions,
            };
            cur = stats.totalSolved;
          } catch (error) {
            console.error(`Error fetching data for ${username}:`, error);
          }
        } else {
          studentData.info = 'No LeetCode data available';
        }
  
        combinedData.push(studentData);
        combinedData.sort((a, b) => (b.totalSolved || 0) - (a.totalSolved || 0));
        fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
        console.log(`Updated data for roll number ${roll} in ${dataset}.`);
        return { name, cur };
      } catch (error) {
        console.error(`Error processing JSON file for ${dataset}:`, error);
      }
    }
  
    if (!found) {
      console.log("Roll number not found in any dataset.");
    }
  }
  


fetchAndSaveData();
setInterval(fetchAndSaveData,2* 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

