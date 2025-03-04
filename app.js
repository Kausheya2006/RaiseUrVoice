const express = require("express");
const path = require("path");
const multer = require("multer");
const collection = require("./mongodb");


const app = express();
const port = 3000;
const Authority = require("./models/authority");
// Static files path
const staticPath = path.join(__dirname, "public");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));

// Configure Multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Handle issue report submissions
app.post("/report", upload.array("images", 5), async (req, res) => {
  try {
    const { name, mobile, aadhar, issue, area } = req.body;
    const images = req.files.map((file) => {
      return {
        filename: file.originalname,
        contentType: file.mimetype,
        data: file.buffer.toString("base64"), // Convert buffer to base64
      };
    });

    if (!name || !mobile || !aadhar || !issue || !area) {
      return res.status(400).sendFile(path.join(staticPath, "error.html"));
    }

    const data = { name, mobile, aadhar, issue, area, images };
    await collection.insertMany([data]);

    res.status(200).sendFile(path.join(staticPath, "success.html"));
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).sendFile(path.join(staticPath, "error.html"));
  }
});

// View all reported issues with images (Base64 data)
// View all reported issues with images (Styled with TailwindCSS)
app.get("/view-reports", async (req, res) => {
  try {
    const reports = await collection.find();

    // Render the reports with centered images and modal functionality
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>View Reports</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100">
          <div class="container mx-auto py-10">
            <h1 class="text-4xl font-bold text-center mb-10">Reported Issues</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${reports
                .map((report) => {
                  return `
                  <div 
                    class="p-6 bg-gray-800 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
                  >
                    <p class="font-semibold text-lg mb-2">${report.name}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Mobile:</strong> ${report.mobile}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Aadhar:</strong> ${report.aadhar}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Issue:</strong> ${report.issue}</p>
                    <p class="text-sm text-gray-400 mb-4"><strong>Area:</strong> ${report.area}</p>
                    <div class="space-y-4">
                      ${report.images
                        .map((image) => {
                          return `
                          <div class="relative flex justify-center items-center overflow-hidden rounded-lg">
                            <img 
                              src="data:${image.contentType};base64,${image.data}" 
                              alt="${image.filename}" 
                              class="w-full max-h-40 object-cover transition-transform duration-300 transform hover:scale-110 cursor-pointer"
                              onclick="showModal('${image.contentType}', '${image.data}', '${image.filename}')"
                            />
                          </div>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                  `;
                })
                .join("")}
            </div>
            <div class="text-center mt-8">
              <a href="https://civilizedchaos.netlify.app/" class="btn">Back to Home</a>
            </div>
          </div>

          <!-- Modal -->
          <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden">
            <div class="relative bg-gray-800 rounded-lg shadow-lg p-4 max-w-3xl w-full">
              <button 
                onclick="closeModal()" 
                class="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
              >
                ✕
              </button>
              <img id="modalImage" src="" alt="" class="w-full rounded-lg" />
              <p id="modalImageName" class="text-gray-400 mt-4 text-center"></p>
            </div>
          </div>

          <script>
            // Show modal with the clicked image
            function showModal(contentType, data, filename) {
              const modal = document.getElementById("imageModal");
              const modalImage = document.getElementById("modalImage");
              const modalImageName = document.getElementById("modalImageName");

              modalImage.src = \`data:\${contentType};base64,\${data}\`;
              modalImageName.textContent = filename;
              modal.classList.remove("hidden");
            }

            // Close the modal
            function closeModal() {
              const modal = document.getElementById("imageModal");
              modal.classList.add("hidden");
            }
          </script>
          <style>
          .btn {
            display: inline-block;
            background-color: #3498db;
            color: #fff;
            font-weight: bold;
            text-align: center;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.3s ease;
            font-size: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn:hover {
            background-color: #2980b9;
            transform: translateY(-4px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
        }

        .btn:active {
            transform: translateY(2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

  /* Responsive styles */
        @media (max-width: 768px) {
          .btn {
            width: 100%;
            padding: 15px 30px;
            font-size: 1.1rem;
        }
      }
      </style>
        </body>
        
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).send("Error fetching reports.");
  }
});


app.get("/graphical-analysis", async (req, res) => {
  try {
    const reports = await collection.find();

    // Initialize arrays for monthly reports, solved, and pending issues
    const monthlyReports = new Array(12).fill(0); // Zero for each month
    const solvedIssues = new Array(12).fill(0);
    const pendingIssues = new Array(12).fill(0);

    // Populate monthly data based on reports
    reports.forEach((report) => {
      const month = new Date(report._id.getTimestamp()).getMonth(); // Get month index (0 = January, 11 = December)
      monthlyReports[month]++;

      // Assuming all reports are "pending" initially
      pendingIssues[month]++;

      // Example of how to differentiate solved and pending issues
      if (report.issue.toLowerCase().includes("resolved")) {
        solvedIssues[month]++;
        pendingIssues[month]--;
      }
    });

    // HTML for the graphical analysis page
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Graphical Analysis</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100">
          <div class="container mx-auto px-4 py-10">
            <h1 class="text-4xl font-extrabold text-center mb-8 text-gray-100 hover:text-gray-300">Graphical Analysis</h1>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Reports Chart -->
              <div class="p-6 bg-gray-800 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
                <canvas id="reportsChart" class="w-full h-80"></canvas>
              </div>

              <!-- Issues Chart -->
              <div class="p-6 bg-gray-800 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
                <canvas id="issuesChart" class="w-full h-80"></canvas>
              </div>
            </div>

            <a href="https://civilizedchaos.netlify.app" class="block mt-8 mx-auto text-center text-lg font-semibold bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-all">
              Back to Home
            </a>
          </div>

          <script>
            // Data for Monthly Reports Filed
            const labels = ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];
            const reportsData = {
              labels: labels,
              datasets: [{
                label: 'Reports Filed',
                data: ${JSON.stringify(monthlyReports)},
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 206, 86, 0.7)',
                  'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(201, 203, 207, 0.7)',
                  'rgba(99, 255, 132, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 159, 64, 0.7)',
                  'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
                  'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(201, 203, 207, 1)',
                  'rgba(99, 255, 132, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)',
                  'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
              }]
            };

            const reportsConfig = {
              type: 'bar',
              data: reportsData,
              options: {
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#ffffff' } },
                  title: { display: true, text: 'Monthly Reports Filed', color: '#ffffff' }
                },
                scales: {
                  x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                  y: { beginAtZero: true, max: 10, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              }
            };

            const reportsChart = new Chart(document.getElementById('reportsChart'), reportsConfig);

            // Data for Solved vs Pending Issues
            const issuesData = {
              labels: labels,
              datasets: [
                {
                  label: 'Issues Solved',
                  data: ${JSON.stringify(solvedIssues)},
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Issues Pending',
                  data: ${JSON.stringify(pendingIssues)},
                  backgroundColor: 'rgba(255, 99, 132, 0.7)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            };

            const issuesConfig = {
              type: 'bar',
              data: issuesData,
              options: {
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#ffffff' } },
                  title: { display: true, text: 'Monthly Issue Resolution (Solved vs Pending)', color: '#ffffff' }
                },
                scales: {
                  x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                  y: { beginAtZero: true, max: 10, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              }
            };

            const issuesChart = new Chart(document.getElementById('issuesChart'), issuesConfig);
          </script>
        </body>
      </html>
    `;

    // Send the rendered HTML as a response
    res.send(html);
  } catch (error) {
    res.status(500).send("Error generating graphical analysis.");
  }
});





// Public: View all authorities
app.get("/authorities", async (req, res) => {
  try {
    const authorities = await Authority.find();
    res.status(200).json(authorities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching authorities." });
  }
});

// Government login page
app.get("/authorities-modify/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html")); // Login page
});

// Handle government login
app.post("/authorities-modify/login", async(req, res) => {
  const { id, password } = req.body;
  console.log("Received data:", req.body);

  // Hardcoded credentials
  const governmentId = "1234";
  const governmentPassword = "qwerty";

  if (id === governmentId && password === governmentPassword) {
   
    res.redirect("/authorities-modify");
  } else {
    res.sendFile(path.join(__dirname, "views", "login.html")); // Reload login page on failure
  }
});

// Modify authorities (protected)
app.get("/authorities-modify", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "modify.html")); // Modify authorities page
});

// Add new authority (protected)
app.post("/authorities-modify/add", async (req, res) => {
  const { name, email, honourScore } = req.body;

  try {
    const newAuthority = new Authority({ name, email, honourScore });
    await newAuthority.save();
    res.status(200).sendFile(path.join(staticPath, "success_add.html"));
    
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).sendFile(path.join(staticPath, "error_add.html"));
  }
});

// Update honour score (protected)
app.post("/authorities-modify/update", async (req, res) => {
  const { name, honourScore } = req.body;

  try {
    const authority = await Authority.findOneAndUpdate(
      { name: name }, // Searching by authority name
      { honourScore: honourScore }, // Updating the honourScore
      { new: true } // Returns the updated document
    );

    if (!authority) {
      return res.status(404).send("Authority not found.");
    }

    // Send a success message along with redirect
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Update Success</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #2c3e50;
              color: #ecf0f1;
            }
            .success-message {
              background-color: #27ae60;
              color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            a {
              display: block;
              margin-top: 20px;
              text-decoration: none;
              color: #3498db;
              font-weight: bold;
              text-align: center;
            }
            a:hover {
              color: #2980b9;
            }
          </style>
        </head>
        <body>
          <div class="success-message">
            <h2>Success!</h2>
            <p>The Honour Score for ${name} has been updated successfully.</p>
            <a href="/authorities-modify">Go back</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error updating honour score.");
  }
});


// Logout for government
app.get("/authorities-modify/logout", (req, res) => {
  res.redirect("/authorities-modify/login");
});

app.get("/view-authorities", async (req, res) => {
  try {
    const authorities = await Authority.find();

    // Render the authorities in a modern blog-like layout
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>List of Authorities</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100">
          <div class="container mx-auto py-10 px-6">
            <h1 class="text-4xl font-bold text-center mb-8">List of Authorities</h1>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${authorities
                .map((authority) => {
                  return `
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all">
                      <h3 class="text-xl font-semibold text-blue-400 mb-2">${authority.name}</h3>
                      <p class="text-gray-300 mb-2">${authority.email}</p>
                      <div class="flex items-center justify-between">
                        <span class="text-gray-500">Honour Score:</span>
                        <span class="text-yellow-400 font-semibold">${authority.honourScore}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="text-center mt-8">
              <a href="https://civilizedchaos.netlify.app/" class="btn">Back to Home</a>
            </div>
          </div>
          <style>
          .btn {
            display: inline-block;
            background-color: #3498db;
            color: #fff;
            font-weight: bold;
            text-align: center;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.3s ease;
            font-size: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn:hover {
            background-color: #2980b9;
            transform: translateY(-4px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
        }

        .btn:active {
            transform: translateY(2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

  /* Responsive styles */
        @media (max-width: 768px) {
          .btn {
            width: 100%;
            padding: 15px 30px;
            font-size: 1.1rem;
        }
      }
      </style>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error("Error fetching authorities:", error);
    res.status(500).send("Error fetching authorities.");
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
