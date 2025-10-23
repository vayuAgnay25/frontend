const app = angular.module("inkMindApp", ["ngRoute"]);
const server_url = "https://backend-pvsse9b2x-vayuagnay25s-projects.vercel.app"

var userStats = {
  alive: false,
  userName: "",
  links: ["home", "login", "signup"],
};

function updateTags(aliveState) {
  if (aliveState === true) {
    userStats.links = ["dashboard", "entries", "contacts", "passwords"];
  } else {
    userStats.links = ["home", "login", "signup"];
  }
}

app.filter("capitalize", function () {
  return function (input) {
    if (!input) return "";
    return input.charAt(0).toUpperCase() + input.slice(1);
  };
});

const savedStats = localStorage.getItem("userStats");
if (savedStats) {
  userStats = JSON.parse(savedStats);
}

app.filter("removeListItem", function () {
  return function (arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.filter((item) => item !== "gallery");
  };
});

app.controller("inkMindController", function ($scope, $location, $http) {
  $scope.User = userStats;
  const time = new Date();
  $scope.date = time;
});

app.controller("LoginController", function ($scope, $http, $location) {
  $scope.message = "";
  $scope.username = "";
  $scope.password = "";

  $scope.login = () => {
    try {
      const Data = {
        username: $scope.username,
        password: $scope.password,
      };

      if (Data.username && Data.password) {
        $http
          .post(`${server_url}/keyPass`, Data, {
            headers: { "content-type": "application/json" },
          })
          .then((response) => {
            $scope.message = response.data.message;
            $scope.messageColor = response.data.messageColor;

            if (response.data.status.toLowerCase() === "ok") {
              userStats.alive = true;
              updateTags(userStats.alive);
              userStats.userName = Data.username;
              localStorage.setItem("userStats", JSON.stringify(userStats));
              $location.path("/dashboard");
              // Ensure digest
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }
          })
          .catch((error) => {
            $scope.message = "Login Failed. Please check your credentials.";
            $scope.messageColor = "red";
          });
      }
    } catch (error) {
      $scope.message = "Login Failed. Please try again later.";
      $scope.messageColor = "red";
    }
  };
});

app.controller("SignupController", function ($scope, $http, $location) {
  $scope.username = "";
  $scope.email = "";
  $scope.password = "";
  $scope.confirmPassword = "";
  $scope.message = "";

  $scope.register = () => {
    try {
      const Data = {
        username: $scope.username,
        email: $scope.email,
        password: $scope.password,
        confirmPassword: $scope.confirmPassword,
      };

      $http
        .post(`${server_url}/register`, Data, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          console.log(response.data);

          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;

          if (
            response.data.status &&
            response.data.status.toLowerCase() === "ok"
          ) {
            userStats.alive = true;
            userStats.userName = Data.username;
            updateTags(userStats.alive);
            localStorage.setItem("userStats", JSON.stringify(userStats));
            $location.path("/dashboard");
          }
        })
        .catch((error) => {
          console.log(error);
          $scope.message = "Failed to register";
          $scope.messageColor = "red";
        });
    } catch (error) {
      console.log(error);
      $scope.message = "Something went wrong";
      $scope.messageColor = "red";
    }
  };
});

app.controller("DashboardController", function ($scope, $http, $location) {
  console.log(userStats.userName);
  $scope.Name = userStats.userName;
  $scope.DPCollection = [
    "default",
    "usop",
    "luffy1",
    "luffy2",
    "luffy3",
    "hancock1",
    "dofi",
    "roger1",
    "sanji",
    "zoro",
    "robin",
    "chopper",
    "chopper2",
    "franky",
    "franky2",
    "shanks",
  ];
  $scope.currentDP = $scope.DPCollection[0];
  $scope.colCount = Math.sqrt($scope.DPCollection.length);

  let UserDetails = {};
  try {
    $scope.changeDP = function () {
      const dialog = document.getElementById("changeProfile");
      if (!dialog) return;
      if (dialog.open) dialog.close();
      else dialog.showModal();
    };

    $scope.setDP = (x, $event) => {
      $event.stopPropagation();
      $event.preventDefault();
      const traverseData = {
        name: userStats.userName,
        DP: x,
        type: "profilepicture",
      };

      $http
        .post(`${server_url}/uploadData`, traverseData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          if (response) {
            if (response.data.status.toLowerCase() === "ok") {
              $scope.currentDP = x || "default";
              $scope.changeDP();
            }
          }
        });
    };

    $http
      .post(
        `${server_url}/dashData`,
        { name: $scope.Name },
        {
          headers: { "content-type": "application/json" },
        }
      )
      .then((response) => {
        $scope.message = response.data.message;
        $scope.messageColor = response.data.messageColor;
        if (response.data.status.toLowerCase() === "failed") {
          $scope.logout();
        } else if (response.data.status.toLowerCase() === "ok") {
          UserDetails = response.data.user;
        }

        $scope.currentDP = UserDetails.ProfilePicture;
        $scope.entries = UserDetails.DairyPages;
        $scope.passwords = UserDetails.SavedPasswords;
        $scope.contacts = UserDetails.SavedContacts;

        $scope.JournalCount = UserDetails.DairyPages
          ? UserDetails.DairyPages.length
          : 10;
        $scope.ContactsCount = UserDetails.SavedContacts
          ? UserDetails.SavedContacts.length
          : 20;
        $scope.PasswordCount = UserDetails.SavedPasswords
          ? UserDetails.SavedPasswords.length
          : 30;

        const DataStats = document.getElementById("myChart").getContext("2d");

        new Chart(DataStats, {
          type: "doughnut", // options: 'line', 'pie', 'doughnut', etc.
          data: {
            labels: ["Journals", "Passwords", "Contacts"],
            datasets: [
              {
                label: "User Stats",
                data: [
                  $scope.JournalCount,
                  $scope.PasswordCount,
                  $scope.ContactsCount,
                ],
                backgroundColor: ["#4caf50", "#2196f3", "#f44336"],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: false, text: "User Dashboard Stats" },
            },
            scales: {
              x: {
                grid: { display: false }, // remove vertical grid lines
              },
              y: {
                beginAtZero: true,
                grid: { display: false }, // remove horizontal grid lines
              },
            },
          },
        });
      })
      .catch((error) => {
        ($scope.message = "cannot find account"), ($scope.messageColor = "red");
      });

    $scope.logout = () => {
      userStats.alive = false;
      updateTags(false);
      localStorage.removeItem("userStats");
      $location.path("/logout");
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    };

    $scope.toggleSecondDialog = (entry) => {
    const dialog = document.getElementById("DE");
    if (dialog.open) {
      dialog.close();
      $scope.heading = "";
      $scope.paragraph = "";
    } else if (!dialog.open) {
      $scope.heading = entry.Title;
      $scope.paragraph = entry.Content;
      dialog.showModal();
    }
  };
  $scope.currentDP = $scope.currentDP?$scope.currentDP:"default";

  } catch (error) {
    $scope.message = "Something went wrong";
    $scope.messageColor = "red";
  }
});

app.controller("JournalController", function ($scope, $http, $location) {
  $scope.entries = [];
  $scope.message = "";
  $scope.messageColor = "";

  const name = userStats.userName;
  try {
    $http
      .post(`${server_url}/dashData`,
        { name },
        { headers: { "content-type": "application/json" } }
      )
      .then((response) => {
        if (response.data.status.toLowerCase() === "ok") {
          $scope.entries = response.data.user.DairyPages
            ? response.data.user.DairyPages
            : [];
          $scope.UserData = response.data.user;
          if ($scope.entries.length == 0) {
            $scope.message = "No entries found. Start by adding a new entry!";
            $scope.messageColor = "grey";
          }
          $scope.entries.array.forEach((element) => {
            console.log(element);
          });
        }
      });
  } catch (error) {
    $scope.message = "Something went wrong";
    $scope.messageColor = "red";
    console.log(error);
  }

  $scope.toggleDialog = () => {
    const dialog = document.getElementById("myDialog");
    if (dialog.open) {
      dialog.close();
    } else if (!dialog.open) {
      dialog.showModal();
    }
  };

  $scope.toggleSecondDialog = (entry) => {
    const dialog = document.getElementById("mySecondDialog");
    if (dialog.open) {
      dialog.close();
      $scope.heading = "";
      $scope.paragraph = "";
    } else if (!dialog.open) {
      $scope.heading = entry.Title;
      $scope.paragraph = entry.Content;
      dialog.showModal();
    }
  };
  months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  $scope.uploadJournal = ($event) => {
    $event.preventDefault();
    try {
      const traverseData = {
        name: userStats.userName,
        title: $scope.title,
        content: $scope.content,
        date: months[new Date().getMonth()],
        type: "journal",
      };

      $http
        .post(`${server_url}/uploadData`, traverseData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          console.log(response);
          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;
          if (response.data.status.toLowerCase() === "ok") {
            $scope.entries.push({
              Date: months[new Date().getMonth()],
              Title: $scope.title,
              Content: $scope.content,
              _id: response.data.returnData._id,
            });
            $scope.title = "";
            $scope.content = "";
            $scope.toggleDialog();
          }
        });
    } catch (error) {
      $scope.message = "Failed to add entry";
      $scope.messageColor = "red";
      console.log(error);
    }
  };

  $scope.deleteEntry = (x, $event) => {
    $event.preventDefault();
    $event.stopPropagation();
    console.log("test started");
    try {
      console.log("passed phase 2");
      const deleteData = {
        name: userStats.userName,
        remove: x,
        type: "journal",
      };
      $http
        .post(`${server_url}/deleteData`, deleteData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          console.log("passed phase 3");
          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;
          if (response.data.status.toLowerCase() === "ok") {
            const index = $scope.entries.indexOf(x);
            if (index > -1) {
              $scope.entries.splice(index, 1);
            }
          }
        })
        .catch((error) => {
          $scope.message = "Failed to delete entry";
          $scope.messageColor = "red";
          console.log(error);
        });
    } catch (error) {
      $scope.message = "Failed to delete entry";
      $scope.messageColor = "red";
      console.log(error);
    }
  };
});

app.controller("ContactsController", function ($scope, $http, $location) {
  $scope.contacts = [];
  $scope.message = " no contacts found. Start by adding a new contact!";
  $scope.messageColor = "red";
  $scope.nameFilter = "";
  $scope.phoneData = "";
  $scope.emailData = "";
  const name = userStats.userName;
  try {
    $scope.toggleContact = () => {
      const dialog = document.getElementById("ContactForm");
      if (dialog.open) {
        dialog.close();
      } else if (!dialog.open) {
        dialog.showModal();
      }
    };

    $scope.deleteContact = (x, $event) => {
      $event.preventDefault();
      $event.stopPropagation();
      try {
        const deleteData = {
          name: userStats.userName,
          remove: x,
          type: "contact",
        };
        $http
          .post(`${server_url}/deleteData`, deleteData, {
            headers: { "content-type": "application/json" },
          })
          .then((response) => {
            console.log("passed phase 3");
            $scope.message = response.data.message;
            $scope.messageColor = response.data.messageColor;
            if (response.data.status.toLowerCase() === "ok") {
              const index = $scope.contacts.indexOf(x);
              if (index > -1) {
                $scope.contacts.splice(index, 1);
              }
            }
          })
          .catch((error) => {
            $scope.message = "Failed to delete contact";
            $scope.messageColor = "red";
            console.log(error);
          });
      } catch (error) {
        $scope.message = "Failed to delete contact";
        $scope.messageColor = "red";
        console.log(error);
      }
    };

    $scope.target = {
      id: "",
      Name: "",
      Email: "",
    };

    $scope.toggleContactModify = (X) => {
      const dialog = document.getElementById("ContactModify");
      if (dialog.open) {
        dialog.close();
      } else if (!dialog.open) {
        dialog.showModal();
      }
      $scope.target.id = X._id;
      $scope.target.Name = X.Name;
      $scope.target.Email = X.Email;
      $scope.currentName = X.Name;
    };

    $scope.modifyContact = () => {
      console.log("modify contact called");
      const modifyData = {
        name: userStats.userName,
        id: $scope.target.id,
        Name: $scope.target.Name,
        Phone: $scope.newPhone,
        Email: $scope.target.Email,
        type: "contact",
      };

      console.log(modifyData);
      if (!$scope.newPhone) {
        $scope.message = "Phone number cannot be empty";
        $scope.messageColor = "red";
        return;
      }

      $http
        .post(`${server_url}/editData`, modifyData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;
          console.log(response);
          if (response.data.status.toLowerCase() === "ok") {
            for (
              let i = 0;
              i < response.data.returnData.SavedContacts.length;
              i++
            ) {
              if (
                response.data.returnData.SavedContacts[i]._id ===
                $scope.target.id
              ) {
                $scope.contacts[i] = response.data.returnData.SavedContacts[i];
              }
            }
            $scope.newPhone = "";
            $scope.toggleContactModify(null);
          }
        })
        .catch((error) => {
          $scope.message = "Failed to modify contact";
          $scope.messageColor = "red";
          console.log(error);
        });
    };

    $scope.saveContact = () => {
      const PostData = {
        name: userStats.userName,
        Name: $scope.nameData,
        Phone: $scope.phoneData,
        Email: $scope.emailData,
        type: "contact",
      };

      $http
        .post(`${server_url}/uploadData`, PostData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;
          if (response.data.status.toLowerCase() === "ok") {
            $scope.contacts.push({
              Name: $scope.nameData,
              Phone: $scope.phoneData,
              Email: $scope.emailData,
              _id: response.data.returnData._id,
            });
            $scope.nameData = "";
            $scope.phoneData = "";
            $scope.emailData = "";
            $scope.toggleContact();
          }
        })
        .catch((error) => {
          $scope.message = "Failed to add contact";
          $scope.messageColor = "red";
          console.log(error);
        });
    };

    $http
      .post(
        `${server_url}/dashData`,
        { name },
        { headers: { "content-type": "application/json" } }
      )
      .then((response) => {
        if (response.data.status.toLowerCase() === "ok") {
          $scope.contacts = response.data.user.SavedContacts
            ? response.data.user.SavedContacts
            : [];
          if ($scope.contacts.length > 0) {
            $scope.message = "";
            $scope.messageColor = "";
          }
        }
      })
      .catch((error) => {
        ($scope.message = "cannot find account"), ($scope.messageColor = "red");
      });
  } catch (error) {
    console.log("error occured:\n\n" + error + "\n\n");
    $scope.message = "Something went wrong";
    $scope.messageColor = "red";
  }
});

app.controller("PasswordController", function ($scope, $http, $location) {
  $scope.passwords = [];
  $scope.message = " no passwords found. Start by adding a new password!";
  $scope.messageColor = "red";
  $scope.PasswordQuery = "";
  $scope.websiteData = "";
  $scope.passwordData = "";
  $scope.usernameData = "";
  const name = userStats.userName;
  try {
    $scope.togglepassword = () => {
      const dialog = document.getElementById("PasswordForm");
      dialog.open ? dialog.close() : dialog.showModal();
    };

    $scope.deletePassword = (x, $event) => {
      $event.preventDefault();
      $event.stopPropagation();
      try {
        console.log("test started");
        console.log("passed phase 1");
        const deleteData = {
          name: userStats.userName,
          remove: x,
          type: "password",
        };
        $http
          .post(`${server_url}/deleteData`, deleteData, {
            headers: { "content-type": "application/json" },
          })
          .then((response) => {
            $scope.message = response.data.message;
            $scope.messageColor = response.data.messageColor;
            console.log(response);
            console.log(response.data.status.toLowerCase() === "ok");
            if (response.data.status.toLowerCase() === "ok") {
              const index = $scope.passwords.indexOf(x);
              if (index > -1) {
                $scope.passwords.splice(index, 1);
              }
            }
          })
          .catch((error) => {
            $scope.message = "Failed to delete password";
            $scope.messageColor = "red";
            console.log(error);
          });
      } catch (error) {
        $scope.message = "Failed to delete password";
        $scope.messageColor = "red";
        console.log(error);
      }
    };

    $scope.UploadPassword = () => {
      const PostData = {
        name: userStats.userName,
        UserName: $scope.usernameData,
        Password: $scope.passwordData,
        Website: $scope.websiteData,
        type: "password",
      };

      $http
        .post(`${server_url}/uploadData`, PostData, {
          headers: { "content-type": "application/json" },
        })
        .then((response) => {
          $scope.message = response.data.message;
          $scope.messageColor = response.data.messageColor;
          console.log(response);
          console.log(response.data.status.toLowerCase() === "ok");
          if (response.data.status.toLowerCase() === "ok") {
            $scope.passwords.push({
              UserName: $scope.usernameData,
              Password: $scope.passwordData,
              Website: $scope.websiteData,
              _id: response.data.returnData._id,
            });
            $scope.usernameData = "";
            $scope.passwordData = "";
            $scope.websiteData = "";
            $scope.togglepassword();
          }
        })
        .catch((error) => {
          $scope.message = "Failed to add password";
          $scope.messageColor = "red";
          console.log(error);
        });
    };

    $http
      .post(
        `${server_url}/dashData`,
        { name },
        { headers: { "content-type": "application/json" } }
      )
      .then((response) => {
        if (response.data.status.toLowerCase() === "ok") {
          $scope.passwords = response.data.user.SavedPasswords
            ? response.data.user.SavedPasswords
            : [];
          if ($scope.passwords.length > 0) {
            $scope.message = "";
            $scope.messageColor = "";
          }
          console.log($scope.passwords);
        }
      })
      .catch((error) => {
        ($scope.message = "cannot find account"), ($scope.messageColor = "red");
      });
  } catch (error) {
    console.log("error occured:\n\n" + error + "\n\n");
    $scope.message = "Something went wrong";
    $scope.messageColor = "red";
  }
});

app.config([
  "$routeProvider",
  "$locationProvider",
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when("/home", {
        templateUrl: "home.html",
      })
      .when("/login", {
        templateUrl: "login.html",
        controller: "LoginController", //check
      })
      .when("/signup", {
        templateUrl: "signup.html",
        controller: "SignupController", //check
      })
      .when("/dashboard", {
        templateUrl: "dashboard.html",
        controller: "DashboardController", //check
        protected: true,
      })
      .when("/logout", {
        template: "",
        controller: function ($scope, $location) {
          userStats.alive = false;
          updateTags(false);
          localStorage.removeItem("userStats");
          $location.path("/home");
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        },
      })
      .when("/entries", {
        templateUrl: "entries.html",
        controller: "JournalController", //check
      })
      .when("/passwords", {
        templateUrl: "passwords.html",
        controller: "PasswordController",
      })
      .when("/contacts", {
        templateUrl: "contacts.html",
        controller: "ContactsController",
      })
      .otherwise({ redirectTo: userStats.alive ? "dashboard" : "/home" });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
  },
]);
app.run(function ($rootScope, $location) {
  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (next.protected && !userStats.alive) {
      $location.path("/home"); // Ensure UI and routing update outside Angular events
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    } else if (
      (next.originalPath === "/login" || next.originalPath === "/signup") &&
      userStats.alive
    ) {
      $location.path("/dashboard");
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    }
  });
});
